# HTTP服务器

## 1. 项目背景和技术特点

### 实现目的

> 从移动端到浏览器，HTTP 协议无疑是打开互联网应用窗口的重要协议，其在网络应用层中的地位不可撼动，是能准确区分前后台的重要协议。

完善对HTTP协议的理论学习，从零开始完成WEB服务器开发。

采用 CS 模型，编写支持中小型应用的HTTP服务器，井结合MySQL。

该项目可以帮助我们从技术上理解上网输入网站URL到关闭浏览器到所有操作中的技术细节。

[HTTP基础知识，这里就不再赘述了](https://blog.csdn.net/yourfriendyo/article/details/126188159)

### 技术特点

- Linux 网络编程 TCP/IP协议、socket流式套接、http协议。
- 多线程技术
- cgi 技术
- shell 脚本
- 线程池

### 开发环境

- centos7
- vim gcc/g++ Makefile

&nbsp;

## 2. 代码结构和实现思路

### TcpServer

先实现HTTP的底层协议TCP的代码，也就是完成基本的网络套接字代码。实现成单例模式以供上层调用。

```cpp
//TcpServer.hpp
#pragma once
#include <iostream>
#include <string>
#include <cstdlib>
#include <cstring>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <pthread.h>
#include <fcntl.h>

#define BACK_LOG 5

class TcpServer
{
private:
    int _port;
    int _listen_sock;

    TcpServer(int port) : _port(port), _listen_sock(-1)
    {}
    TcpServer(const TcpServer& ts) = delete;
    TcpServer operator=(const TcpServer& ts) = delete;

    static TcpServer* _svr;
public:

    static TcpServer* GetInstance(int port);
    void InitServer();

    void Socket();
    void Bind();
    void Listen();
    ~TcpServer()
    {}
};
TcpServer* TcpServer::_svr = nullptr;
```

### HttpServer

HttpServer类实现调用TcpServer单例，并进入事件循环。

```cpp
#pragma once
#include <iostream>
#include <pthread.h>
#include "TcpServer.hpp"
#include "Protocol.hpp"

#define PORT 8080

class HttpServer
{
private:
    int _port;
    TcpServer* _tcp_svr;
    bool _stop;

public:
    HttpServer(int port = PORT) : _port(port), _tcp_svr(nullptr), _stop(false)
    {}

    void InitServer() {
        _tcp_svr = TcpServer::GetInstance(_port);
    }

    void Loop();

    ~HttpServer()
    {}
};
```

接下来就是，读取请求，分析请求，构建响应并返回。

### Protocol

定制HTTP请求和响应的协议。接着就是`EndPoint`类实现HTTP读取解析响应等一系列函数。

```cpp
struct HttpRequest
{
    std::string _request_line;
    std::vector<std::string> _request_headers;
    std::string _blank;
    std::string _request_body;

    std::string _method;
    std::string _uri;
    std::string _version;

    std::string _path;
    std::string _query;
    struct stat _resoucre_stat;
    bool _cgi = false;

    std::unordered_map<std::string, std::string> _header_kvs;
};

struct HttpResponse
{
    std::string _status_line;
    std::vector<std::string> _response_headers;
    std::string _blank = LINE_BREAK;
    std::string response_body;

    int _status_code = OK;
    int _resource_fd = -1;
};
```

```cpp
class EndPoint
{
private:
    int _sock;
    HttpRequest _http_request;
    HttpResponse _http_response;

private:
    void RecvHttpRequestLine();
    void RecvHttpRequestHeadler();

    void ParseHttpRequestLine();
    void ParseHttpRequestHeadler();
    void RecvParseHttpRequestBody();

	int ProcessCgi();
	int ProcessWebPage();

public:
    EndPoint(int sock) : _sock(sock) {}

    void RecvHttpRequest()
    {
        RecvHttpRequestLine();
        RecvHttpRequestHeadler();
    }
    void ParseHttpRequest()
    {
        ParseHttpRequestLine();
        ParseHttpRequestHeadler();
        RecvParseHttpRequestBody();
    }
	void BuildHttpResponse();
    void SendHttpResponse();

    ~EndPoint()
    {}
};
```

#### 读取和解析请求

当前请求时，我们以行为单位。

从各大平台发来的数据的行分隔符各有不同，我们要做的是兼容所有情况，也就是我们要自行实现读取一行数据的接口。

```cpp
void EndPoint::RecvHttpRequestLine()
{
    std::string& line = _http_request._request_line;
    Util::ReadLine(_sock, &line);
    line.resize(line.size() - 1);
}
void EndPoint::RecvHttpRequestHeadler()
{
    std::string line;
    while (true) // 读到空行，读取结束
    {
        Util::ReadLine(_sock, &line);
        if (line == "\n") {
            _http_request._blank = line; // 将空行放到blank中
            break;
        }
        line.resize(line.size() - 1);
        _http_request._request_headers.push_back(std::move(line));
        line.clear();
    }
}

void EndPoint::ParseHttpRequestLine()
{
    std::stringstream ss(_http_request._request_line);
    ss >> _http_request._method >> _http_request._uri >> _http_request._version;
}
void EndPoint::ParseHttpRequestHeadler()
{
    for (auto& header : _http_request._request_headers)
        _http_request._header_kvs.insert(Util::GetKV(header, ": "));
}
void EndPoint::RecvParseHttpRequestBody()
{
    auto& method = _http_request._method;
    auto& headers_map = _http_request._header_kvs;
    auto& body = _http_request._request_body;
    auto iter = headers_map.find("Content-Length");
    if (iter == headers_map.end())
        return;
    else
        _http_request._content_length = stoi(iter->second);
    Util::ReadLine(_sock, &body);
    body.resize(body.size() - 1);
}
```

#### 构建和返回响应

如果是GET方法获取资源路径，并进行一系列的检查判断。根据请求资源的类型设置CGI处理，如果是POST方法直接设置CGI。

```cpp
void EndPoint::BuildHttpResponse()
{
    auto& code = _http_response._status_code;
    auto& path = _http_request._path;
    auto& rsrc_st = _http_request._resoucre_stat;

    // 排除非法请求
    if (_http_request._method != "GET" && _http_request._method != "POST") {
        LOG(WARNING) << "bad request invaild method\n";
        code = BAD_REQUEST;
        goto END;
    }

    if (_http_request._method == "GET") {
        size_t pos = _http_request._uri.find('?');
        if (pos != std::string::npos) {
            Util::CutString(_http_request._uri, &path, &_http_request._query, pos);
            _http_request._cgi = true; // 带参一定用cgi
        }
        else
            path = _http_request._uri;

        // 检查资源路径
        path = WEB_ROOT + path; // 拼接web根目录前缀
        if (path.back() == '/')
            path += HOME_PAGE; // 拼接默认访问资源后缀

        //判断资源路径是否合法
        if (stat(path.c_str(), &rsrc_st) == 0) {
            if (S_ISDIR(rsrc_st.st_mode)) {
                path += "/" + HOME_PAGE;
                stat(path.c_str(), &rsrc_st);
            }
            if (rsrc_st.st_mode & S_IXUSR ||
                rsrc_st.st_mode & S_IXGRP ||
                rsrc_st.st_mode & S_IXOTH)
                _http_request._cgi = true;
        }
        else {
            LOG(WARNING) << "require " << path + " resource not found\n";
            code = NOT_FOUND;
            goto END;
        }
    }
    else if (_http_request._method == "POST") {
        _http_request._cgi = true;
        path = WEB_ROOT + _http_request._uri;
    }
    else {}

    // 处理请求
    if (_http_request._cgi == true) {
        code = ProcessCgi();     // 执行cgi请求，程序运行结果放到response_body中
        if (code == OK)
            LOG(INFO) << "cgi process executed success\n";
        code = ProcessWebPage(); // 讲cgi结果构建网页返回
    }
    else {
        code = ProcessWebPage(); // 返回静态网页
        if (code == OK)
            LOG(INFO) << "send " + path + " success\n";
    }
}
```

发送响应就是简单的将构建好的响应返回给对端即可。

```cpp
void EndPoint::SendHttpResponse()
{
    send(_sock, _http_response._status_line.c_str(), _http_response._status_line.size(), 0);
    for (auto& header : _http_response._response_headers) {
        header += LINE_BREAK;
        send(_sock, header.c_str(), header.size(), 0);
    }
    send(_sock, _http_response._blank.c_str(), _http_response._blank.size(), 0);
    if (_http_request._cgi) {
        auto& body = _http_response.response_body;
        int total = 0;
        while (total < body.size()) {
            ssize_t s = send(_sock, body.c_str() + total, body.size() - total, 0);
            if (s == 0) break;
            total += s;
        }
    }
    else {
        sendfile(_sock, _http_response._resource_fd, 0, _http_request._resrc_stat.st_size);
        close(_http_response._resource_fd);
    }

    LOG(INFO) << "send http response success\n";
}
```

#### 处理静态和非静态请求

构建普通网页响应。

```cpp
int ProcessNonCgi()
{
    _http_response._resource_fd = open(_http_request._path.c_str(), O_RDONLY);
    if (_http_response._resource_fd < 0)
        return NOT_FOUND;

    auto& line = _http_response._status_line;
    auto& code = _http_response._status_code;
    line = HTTP_VERSION + " " + std::to_string(code) + " " + Util::Code2Desc(code) + LINE_BREAK;

    auto& stat = _http_request._resoucre_stat;
    auto& path = _http_request._path;
    std::string content_type_header = "Content-Type: " + Util::Suffix2Type(GetSuffix(path));
    std::string content_length_header = "Content-Length: " + std::to_string(stat.st_size);
    std::string content_language_header = "Content-Language: zh-cn";

    _http_response._response_headers.push_back(content_type_header);
    _http_response._response_headers.push_back(content_length_header);
    _http_response._response_headers.push_back(content_language_header);

    return OK;
}
```

构建CGI响应。这是本项目的重难点。

线程首先首先创建子进程，将具体执行进程程序替换的任务交给子进程。

其次定制父子进程通信协议。

请求方法，GET方法的请求参数，报头中的正文大小几个变量都用环境变量导给子进程。POST方法的请求体使用管道导给子进程。

中个细节代码中有注释说明。

```cpp
int ProcessCgi()
{
    auto& method = _http_request._method;
    auto& body = _http_request._request_body;
    auto& path = _http_request._path;
    auto& code = _http_response._status_code;

    // 构建两个管道，一个是父写子读，一个是父读子写，管道从父进程角度命名
    // parent output[1]  -->  output[0] child
    // parent  input[0]  <--  input[1]  child
    int input[2];  // 父读子写
    int output[2]; // 父写子读
    if (pipe(input) < 0 || pipe(output) < 0)
        return SVR_ERROR;

    pid_t pid = fork();
    if (pid == 0) /* child */ {
        close(input[0]);
        close(output[1]);

        int ret = setenv("METHOD", method.c_str(), 1); // 先导请求方法
        if (method == "GET") // 再导GET请求参数
            ret |= setenv("QUERY", _http_request._query.c_str(), 0);
        else if (method == "POST") // 再导正文大小
            ret |= setenv("CONTENT_LENGTH", std::to_string(body.size()).c_str(), 0);

        if (ret < 0)
            LOG(WARNING) << "set env failed, errno: " << errno << '\n';

        dup2(input[1], 1);
        dup2(output[0], 0);

        execl(_http_request._path.c_str(), _http_request._path.c_str(), nullptr);
        code = SVR_ERROR;
        exit(1);
    }
    else if (pid > 0) /* parent */ {
        close(input[1]);
        close(output[0]);

        if (_http_request._method == "POST") {
            auto& body = _http_request._request_body;
            int already = 0;
            while (already < body.size()) {
                ssize_t s = write(output[1], body.c_str() + already, body.size() - already);
                if (s == 0) break;
                already += s;
            }
        }

        int status = 0;
        pid_t ret = waitpid(pid, &status, 0);
        if (ret < 0)
            LOG(ERROR) << "parent process wait failed\n";
            code = SVR_ERROR;
        }
        close(input[0]);
        close(output[1]);
        return code;
    }
    else { /* pid < 0 */
        LOG(ERROR) << "failed to create child process\n";
        return SVR_ERROR;
    }

    return code;
}
```

### 差错处理

在读取请求构建响应发送响应的过程中，都穿插着错误判断，并以HTTP响应状态码作为返回值。

在适当的地方`goto END;`，直接进行错误处理。错误处理利用得到的状态码构建错误响应，也就是返回错误网页，如404页面。

```cpp
void BuildHttpResponse()
{
    // 排除非法请求
    if (_http_request._method != "GET" && _http_request._method != "POST")
    {
        LOG(WARNING) << "bad request invaild method\n";
        code = BAD_REQUEST;
        goto END;
    }

	//...

    // 差错处理
    END:
    if (code != OK)
    {
        LOG(INFO) << "headler error begin, code: " << code << '\n';
        ErrorHelper(); // 构建错误响应
    }
}

private:
void ErrorHelper()
{
    _http_request._cgi = false; // 错误处理，返回静态网页
    auto& code = _http_response._status_code;

    switch (code)
    {
        case BAD_REQUEST:
            HeadlerWrong(PAGE_404);
            break;
        case NOT_FOUND:
            HeadlerWrong(PAGE_404); // 单独构建404页面
            break;
        case SVR_ERROR:
            HeadlerWrong(PAGE_404);
            break;
        case SVR_UNAVL:
            HeadlerWrong(PAGE_404);
            break;
        default:
            LOG(WARNING) << "unkown error code" << std::endl;
            break;
    }
}

void HeadlerWrong(const std::string& wrong_page)
{
    _http_request._path = WEB_ROOT + '/' + wrong_page;
    stat(_http_request._path.c_str(), &_http_request._resoucre_stat);
    ProcessWebPage(); // 返回404页面
}

int ProcessCgi()
{
 	if (pid == 0) {
        //...
    }
    else if (pid > 0) { /* parent */
        // 获取子进程退出结果
        int status = 0;
        pid_t ret = waitpid(pid, &status, 0);
        if (ret == pid)
        {
            // 管道读取子进程输出
            char ch = 0;
            while (read(input[0], &ch, 1))
                _http_response.response_body.push_back(ch); // 子进程输出放到响应体中

            //判断进程是否正常终止
            if (WIFEXITED(status)) {
                LOG(INFO) << "subprocess exited exit code: " << WEXITSTATUS(status) << '\n';
                if (WEXITSTATUS(status) != 0)
                    code = BAD_REQUEST;
            } else {
                LOG(INFO) << "subprocess exited by signal: " << WIFEXITED(status) << '\n';
                code = BAD_REQUEST;
            }
        }
        else {
            LOG(ERROR) << "parent process wait failed\n";
            code = SVR_ERROR;
        }
        //...

        return code;
    }
    else /* pid < 0 */ {
        LOG(ERROR) << "failed to create child process\n";
        return SVR_ERROR;
    }

    return code;
}
```

### 引入线程池

任务队列中的任务类，设置回调方法，使任务体能够自行调用处理任务的函数。

```cpp
class Task
{
private:
    int _sock;
    CallBack HandlerTask; // 设置回调 当队列中有任务时，调用回调让后端处理任务

public:
    Task() {}
    Task(int sock) : _sock(sock) {}
    ~Task() {}

    void ProcessTask() {
        HandlerTask(_sock);
    }
};
```

将`HeaderRequest`方法，构建成回调`CallBack`仿函数。

```cpp
class CallBack
{
public:
    CallBack() {}
    ~CallBack() {}

public:
    void operator()(int sock) {
        EndPoint* ep = new EndPoint(sock);
        if (ep->RecvHttpRequest() && ep->ParseHttpRequest()) {
            ep->BuildHttpResponse();
            ep->SendHttpResponse();
        }
        else
            LOG(WARNING) << "recv http request failed\n";

        delete ep;
    }
};
```

设置线程池，并配备任务队列。

交给外部`HTTPServer`类向任务队列中添加`accept`接受到的任务。

自身设置`TASK_NUM`数量的线程来同步互斥地获取任务队列中的任务。

```cpp
class ThreadPool
{
private:
    std::queue<Task> _task_queue;
    int _task_num;
    bool _stop;

    pthread_mutex_t _mtx;
    pthread_cond_t _cond;
    static ThreadPool* _thread_pool;

private:
    ThreadPool() = default;
    ThreadPool(int num = TASK_NUM) : _task_num(num), _stop(false) {
        pthread_mutex_init(&_mtx, nullptr);
        pthread_cond_init(&_cond, nullptr);
    }
    ThreadPool(const ThreadPool&) = delete;

public:
    static ThreadPool* GetInstance() {
        pthread_mutex_t lck = PTHREAD_MUTEX_INITIALIZER;
        if (_thread_pool == nullptr) {
            pthread_mutex_lock(&lck);
            if (_thread_pool == nullptr) {
                _thread_pool = new ThreadPool(TASK_NUM);
                _thread_pool->InitThreadPool();
            }
            pthread_mutex_unlock(&lck);
        }
        return _thread_pool;
    }

    void InitThreadPool() {
        for (int i = 0; i < _task_num; ++i) {
            pthread_t tid;
            if (pthread_create(&tid, nullptr, ThreadRoutine, (void*)_thread_pool) != 0) {
                LOG(FATAL) << "create pthread failed\n";
                exit(1);
            }
        }
        LOG(INFO) << "thread pool init success\n";
    }

    bool isEmpty() {
        return _task_queue.empty();
    }
    void Lock() {
        pthread_mutex_lock(&_mtx);
    }
    void Unlock() {
        pthread_mutex_unlock(&_mtx);
    }
    void ThreadWait() {
        pthread_cond_wait(&_cond, &_mtx);
    }
    void ThreadWakeup() {
        pthread_cond_signal(&_cond);
    }

    static void* ThreadRoutine(void* args) {
        ThreadPool* tp = (ThreadPool*)args;
        while (!tp->_stop) {
            tp->Lock();

            while (tp->isEmpty())
                tp->ThreadWait();

            Task task;
            tp->PopTask(&task);

            tp->Unlock();
            task.ProcessTask();
        }
    }

    void PushTask(const Task& task) {
        Lock();

        _task_queue.push(task);

        Unlock();
        ThreadWakeup();
    }

    void PopTask(Task* task) {
        *task = _task_queue.front();
        _task_queue.pop();
    }

    ~ThreadPool() {
        pthread_mutex_destroy(&_mtx);
        pthread_cond_destroy(&_cond);
    }
};
ThreadPool* ThreadPool::_thread_pool = nullptr;
```

```cpp
class HttpServer
{
private:
    int _port;
    TcpServer* _tcp_svr;
    ThreadPool* _thread_pool;
    bool _stop;

public:
    HttpServer(int port = PORT) : _port(port), _tcp_svr(nullptr), _stop(false) {}
    ~HttpServer() {}

    void InitServer() {
        signal(SIGPIPE, SIG_IGN); // 忽略SIGPIPE信号
        _tcp_svr = TcpServer::GetInstance(_port);
        _thread_pool = ThreadPool::GetInstance();
    }

    void Loop() {
        while (!_stop) {
            struct sockaddr_in peer;
            socklen_t len = sizeof(peer);
            int sock = accept(_tcp_svr->GetListenSock(), (struct sockaddr*)&peer, &len);
            if (sock < 0) continue;

            Task task(sock);
            _thread_pool->PushTask(task);
        }
    }
};
```

### 调用逻辑

<center>
<img src="https://img.gejiba.com/images/f6f73baa5fd26e94615388c1a585f610.png" alt="httpserver调用逻辑" border="0" style="zoom:50%;" >
</center>

&nbsp;

## 3. 难点总结和项目扩展

对于CGI机制的理解和实现。

<center>
<img src="https://img.gejiba.com/images/60227f51c300c20f1f1b5879101d5270.png" alt="HTTP服务流程" border="0">
</center>

整个HTTP服务就是CGI程序和客户端沟通的桥梁，因为CGI程序与外界的输入输出都由HTTP服务器代理和转发。

通过子进程进程程序替换的方式，能够调用任意程序，且可以获得程序的运行结果和控制其输入输出。

### 项目扩展

- URL encode decode
- 数据库增删查改
- HTTP其他方法
- 配置文件化
- 301302转发

#### 业务层面

- [ ] 实现在线计算器（日期转换等）
- [x] 实现在线简历
- [ ] 实现博客系统

#### 技术层面

- [ ] 支持HTTP1.1长连接（链接管理）
- [ ] 提高并发量和执行效率
- [ ] 支持redis
- [ ] 支持多机器业务转发负载均衡的代理功能