# 负载均衡式OJ

## 1. 项目技术和开发环境

### 项目技术

- C++ STL 标准库
- Boost 库
- cpp-httplib 第三方开源网络库
- ctemplate 第三方开源前端网页渲染库
- jsoncpp 第三方开源序列化、反序列化库
- 负载均衡设计
- 多进程、多线程
- MySQL C Connect
- html /css/js/jquery/ajax

### 开发环境

- centos 7 服务器
- vim / gcc(g++) / makefile

&nbsp;

## 2. 结构设计和实现思路

<img src="https://img.gejiba.com/images/e7cae9c024d3a18ec9a3f42bad44df1b.png" style="zoom:50%;" >

我们的项目核心是如下三个模块：

| 目录             | 介绍                                                         |
| ---------------- | ------------------------------------------------------------ |
| `comm`           | 公共模块，存放公用的代码如一些工具类                         |
| `compile_server` | 编译模块，编译运行远端提交的代码                             |
| `oj_server`      | 服务模块，提供题目列表、题目查看、题目编写，实现反向代理负载均衡的功能 |

> 在线判题方面我们只实现类似牛客、力扣等网站的题目列表和在线编程的功能。

项目目录结构大致如下：

```shell
OnlineJudge/
├── comm/
│   ├── httplib.h -> ../depts/cpp-httplib/httplib.h
│   ├── log.hpp
│   └── util.hpp
├── compile_server/
│   ├── compile_server.cc
│   ├── compile_run.hpp
│   ├── compiler.hpp
│   ├── runner.hpp
│   ├── Makefile
│   └── temp/
├── oj_server/
│   ├── oj_server.cc
│   ├── oj_model.hpp
│   ├── oj_controller.hpp
│   ├── oj_view.hpp
│   └── Makefile
└── Makefile
```

&nbsp;

### 2.1 日志模块

```cpp
#pragma once
#include <iostream>
#include <string>
#include "util.hpp"

namespace NS_Log
{
    using namespace NS_Util;

    // log level
    enum
    {
        INFO,
        DEBUG,
        WARNING,
        ERROR,
        FATAL
    };

    // LOG() << "xxxxxx";
	std::ostream& Log(const std::string& level, const std::string& file_name, int line)
    {
        std::string message = "[" + level + "]";         // 添加日志等级

        message += "[" + file_name + "]";                // 获取报错文件
        message += "[" + std::to_string(line) + "]";     // 获取报错行号
        message += "[" + TimeUtil::GetTimeStamp() + "]"; // 获取日志时间

        std::cout << message; // 存入缓冲区，不刷新待填充报错信息
        return std::cout;
    }

#define LOG(level) Log(#level, __FILE__, __LINE__)
}
```

&nbsp;

### 2.2 编译运行模块

#### 编译模块

<img src="https://img.gejiba.com/images/6d7b7ff8f8caee6ca1777baeabd8e7d2.png" style="zoom:50%;" >

```cpp
// ret: 编译是否成功
// file_name: 编译文件名
// ./temp/123.cpp
// ./temp/123.exe
// ./temp/123.err
static bool Compile(const std::string& file_name)
{
    pid_t pid = fork();

    if (pid == 0) /* child */
    {
        int fd = open(PathUtil::Err(file_name).c_str(), O_CREAT | O_WRONLY, 644);
        if (fd < 0)
        {
            LOG(WARNING) << "cannot open err file, maybe not existed\n";
            exit(1);
        }

        dup2(err_fd, 2); // 将报错信息重定向至.stderr文件中

        //g++ -o 123.exe 123.cpp -std=c++11
        execlp(
            "g++",
            "-o",
            PathUtil::Exe(file_name).c_str(),
            PathUtil::Src(file_name).c_str(),
            "-std=c++11",
            nullptr
        );

        LOG(ERROR) << "compile(g++) file failed, exec's arguments were wrong\n";
        exit(2);

    }
    else if (pid > 0) /* parent */
    {
        waitpid(pid, nullptr, 0);

        if (FileUtil::IsFileExists(PathUtil::Exe(file_name))) // 编译成功
        {
            LOG(INFO) << "compile(g++) success, get " << PathUtil::Exe(file_name);
            return true;
        }
    }
    else /* pid < 0 error */
    {
        LOG(ERROR) << "child proccess create failed\n";
        return false;
    }
}
```

#### 运行模块

运行功能由`runner.hpp`提供。

运行模块不需要考虑代码运行的结果是否正确，只关心程序是否正常退出。程序的退出信息交给上层模块处理。

其次我们要控制程序的输入输出，

- 标准输入：不作处理
- 标准输出：一般是程序运行的结果
- 标准错误：运行时错误信息

```cpp
static int Run(const std::string& file_name)
{
    std::string exe_file = PathUtil::Exe(file_name);
    int sin_fd = FileUtil::OpenFile(PathUtil::Stdin(file_name));
    int sout_fd = FileUtil::OpenFile(PathUtil::Stdout(file_name));
    int serr_fd = FileUtil::OpenFile(PathUtil::Stderr(file_name));

    if (sin_fd == 0 || sin_fd == 0 || serr_fd == 0)
        exit(3);

    pid_t pid = fork();
    if (pid == 0) /* child */
    {
        //重定向标准输出输入错误
        dup2(sin_fd, 0);
        dup2(sout_fd, 1);
        dup2(serr_fd, 2);
        SetProcLimit(cpu_limit, mem_limit); // 资源约束

        // ./tmp/code.out
        execl(exe_file.c_str(), exe_file.c_str());

        exit(-2);
    }
    else if (pid > 0) /* parent */
    {
        int status = 0;
        waitpid(pid, &status, 0);
        return status & 0x7F; // 返回程序的退出信息，具体情况交给oj模块处理
    }
    else /* error */
    {
        close(sin_fd);
        close(sout_fd);
        close(serr_fd);
    }
}
```

##### 限制时空复杂度

通过`setrlimit()`限制程序的资源的占用大小。如CPU时间，占用空间大小等。分别通过发出`24)SIGCPU`和`6)SIGABRT`信号终止程序。

故我们可以在运行子进程之前设置资源约束，在子进程运行结束后也可以通过父进程等待的返回值，确定子进程是否是异常退出以及是否收到第几位信号。

```cpp
// 设置子进程运行占用资源的大小
static void SetProcLimit(int cpu_limit, int mem_limit)
{
    struct rlimit cpu_rl;
    cpu_rl.rlim_max = RLIM_INFINITY;
    cpu_rl.rlim_cur = cpu_limit;
    setrlimit(RLIMIT_CPU, &cpu_rl);

    struct rlimit mem_rl;
    mem_rl.rlim_max = RLIM_INFINITY;
    mem_rl.rlim_cur = mem_limit * 1024; // 转化成KB
    setrlimit(RLIMIT_AS, &mem_rl);
}
```

#### 编译运行模块

<img src="https://img.gejiba.com/images/9b8e05359f869ada83a088f297fb4b95.png" style="zoom:50%;"  >

`compile_run.hpp`实现编译和运行功能。

要能够适配用户需求，定制通信协议字段，正确调用编译和运行模块。

```cpp
/***************************************************************
 * 输入json串：
 *   code    : 用户提交代码
 *   input   : 用户提交代码的标准输入内容，不作处理以待扩展
 *   cpu_lim : 时间复杂度
 *   mem_lim : 空间复杂度
 * {"code": "#include...", "input": "", "cpu_lim": "1", "mem_lim": "10240"}
 *
 * 输出json串：
 *   必填：
 *   status  : 状态码
 *   reason  : 结果原因
 *   选填：
 *   stdout  : 用户提交代码的运行正确结果
 *   stderr  : 用户提交代码的运行错误结果
 * {"status": "0", "reason": "", "stdout": "", "stdin": ""}
***************************************************************/
static void Start(const std::string& in_json, std::string* out_json)
{
    // 反序列化
    Json::Value in_value;
    Json::Reader reader;
    reader.parse(in_json, in_value); // 解析in_json

    std::string code = in_value["code"].asString();
    std::string input = in_value["input"].asString();
    int cpu_limit = in_value["cpu_lim"].asInt();
    int mem_limit = in_value["mem_lim"].asInt();

    int status_code = 0;
    int ret_code = 0;
    std::string file_name;

    if (code.size() == 0)
    {
        status_code = -1; // 代码为空
        goto ERROR;
    }
    // 生成源文件并写入
    file_name = FileUtil::UniqueFileName();
    if (!FileUtil::WriteFile(PathUtil::Src(file_name), code))
    {
        status_code = -2; // 文件写入错误
        goto ERROR;
    }
    // 编译源文件
    if (!Compiler::Compile(file_name))
    {
        status_code = -3; // 代码编译错误
        goto ERROR;
    }
    // 运行可执行文件
    ret_code = Runner::Run(file_name, cpu_limit, mem_limit);
    if (ret_code < 0) // 内部错误
    {
        status_code = -2;
        goto ERROR;
    }
    else // ret_code >= 0 程序异常或正常退出
    {
        status_code = ret_code;
        goto ERROR;
    }
    ERROR:
    Json::Value out_value;
    out_value["status"] = status_code;
    out_value["reason"] = StatusUtil::CodeToDesc(status_code, file_name);
    if (status_code == 0)
    {
        out_value["stdout"] = FileUtil::ReadFile(PathUtil::Stdout(file_name));
        out_value["stderr"] = FileUtil::ReadFile(PathUtil::Stderr(file_name));
    }
    //序列化
    Json::StyledWriter writer;
    *out_json = writer.write(out_value);

    FileUtil::DeleteTempFile(file_name); // 清理临时文件
}
```

#### 服务模块

编译服务随时可能被多人请求，必须保证上传调源文件名唯一。下面代码仅用来测试功能是否正确。

```cpp
//客户端通过HTTP协议向编译服务上传一个json串，编译模块发送回一个json串
int main()
{
    std::string in_json;
    std::string out_json;

    Json::Value in_value;
    in_value["code"] = R"(#include <iostream>
int main()
{
    std::cout << "hello world" << std::endl;
    // int* p = new int[1024*1024*1024];
    // while (1);
    // int a = 1 / 0;
    // aaa
    return 0;
})";
    in_value["input"] = "";
    in_value["cpu_lim"] = 1;
    in_value["mem_lim"] = 1024 * 30;

    Json::StyledWriter writer;
    in_json = writer.write(in_value);
    std::cout << in_json << std::endl;

    CompileAndRun::Start(in_json, &out_json);

    std::cout << out_json << std::endl;

    return 0;
}
```

我们使用`cpp-httplib`来将编译服务模块打包成网络服务，`cpp-httplib`要求`gcc/g++`版本必须高于`7`。我们使用`scl`工具集安装：

```shell
$ sudo yum install centos-release-scl scl-utils-build -y    # 安装scl yum源
$ sudo yum install -y devtoolset-9-gcc devtoolset-9-gcc-c++ # 安装scl gcc版本工具集
$ ls /opt/rh/                                               # 查看安装工具集
$ scl enable devtoolset-9 bash                              # 启动工具集
$ gcc -v
```

```cpp
int main()
{
    Server svr;

    // 用来基本测试
    svr.Get("/hello", [](const Request& req, Response& rsp) {
            rsp.set_content("hello httplib, 你好网络库", "text/pain; charset=utf-8");
        }
    );

    // 提供编译运行服务
    svr.Post("/compile_and_run", [](const Request& req, Response& rsp)
        {
            std::string in_json = req.body;
            std::string out_json;
            if (!in_json.empty())
            {
                CompileAndRun::Start(in_json, &out_json);
                rsp.set_content(out_json, "application/json; charset=utf-8");
            }
        }
    );

    svr.listen("0.0.0.0", 8080); // 启动http服务
    return 0;
}
```

如上代码就是我们的网络编译服务，我们采用 Posman 进行测试。

<img src="https://img.gejiba.com/images/efd2a8002767a76db63ae126162d6601.png" style="zoom:50%;" >

至此，我们的编译运行服务模块就完成了。

> 为什么将编译运行模块独立成一个服务呢？

编译运行服务比较耗时耗资源，危险系数比较高，独立出来便于进行分布部署在多台主机。

&nbsp;

### 2.3 OJ服务模块

OJ服务本质就是建立一个小型的在线判题网站。我们只提供最基本的网站功能：

1. 首页获取：使用题库列表页面充当首页；
2. 代码编辑：
3. 代码提交：对应编译和运行模块。

我们采用MVC结构来设计OJ服务模块，何为MVC呢？

| 概念 | 含义                                                  |
| ---- | ----------------------------------------------------- |
| `M`  | `Model`，进行数据交互的模块，比如对题库进行增删改查。 |
| `V`  | `View`，拿到数据后，进行构建和渲染网页。              |
| `C`  | `Control`，控制数据交互等，就是我们的核心业务逻辑。   |

#### 服务路由模块

用户请求的服务不同，我们就要进行不同的工作，所以我们首先要实现服务路由的功能。

```cpp
// 服务路由功能
Server svr;

/* 获取题库列表 */
svr.Get("/problem_set", [](const Request& req, Response& rsp) {
    rsp.set_content("这是所有题目的列表", "text/plain; charset=utf8");
});
/* 根据题号获取题目内容 */
// /problems/10 正则表达式匹配
svr.Get(R"(/problems/(\d+))", [](const Request& req, Response& rsp) {
    std::string problem_number = req.matches[1];
    rsp.set_content("这是指定的一道题，题号：" + problem_number, "text/plain; charset=utf8");
});
/* 提交代码，使用编译运行服务 */
svr.Get(R"(/judge/(\d+))", [](const Request& req, Response& rsp) {
    std::string problem_number = req.matches[1];
    rsp.set_content("这是该题的判题，题号：" + problem_number, "text/plain; charset=utf8");
});

svr.set_base_dir("./wwwroot");
svr.listen("0.0.0.0", 8080);
```

#### 题目题库设计

题目具有如下属性：题目的编号，题目的标题，题目的难度，题目的题干，题目的时间空间要求，测试用例等等。

我们建立两张表，一张是题库列表，第二张表存放题目的描述、题目的预设置代码`header.cpp`和测试用例代码`tail.cpp`等等。

```cpp
// header.cpp
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // coding here...

    }
};
```

```cpp
// tail.cpp
#ifndef COMPILER_ONLINE
#include "header.cpp"
#endif

void Test1()
{
    vector<int> nums = { 2,7,11,15 };
    vector<int> ret = Solution().twoSum(nums, 9);
    if (find(ret.begin(), ret.end(), 0) != ret.end() &&
        find(ret.begin(), ret.end(), 1) != ret.end())
    {
        std::cout << "通过测试用例1" << std::endl;
    }
    else
    {
        std::cout << "测试用例1失败" << std::endl;
    }
}

void Test2()
{
    vector<int> nums = { 3,2,4 };
    vector<int> ret = Solution().twoSum(nums, 6);
    if (find(ret.begin(), ret.end(), 2) != ret.end() &&
        find(ret.begin(), ret.end(), 4) != ret.end())
    {
        std::cout << "通过测试用例2" << std::endl;
    }
    else
    {
        std::cout << "测试用例2失败" << std::endl;
    }
}

void Test3()
{
    vector<int> nums = { 3,3 };
    vector<int> ret = Solution().twoSum(nums, 6);
    if (find(ret.begin(), ret.end(), 0) != ret.end() &&
        find(ret.begin(), ret.end(), 1) != ret.end())
    {
        std::cout << "通过测试用例1" << std::endl;
    }
    else
    {
        std::cout << "测试用例1失败" << std::endl;
    }
}

int main()
{
    Test1();
    Test2();
    Test3();

    return 0;
}
```

合并`header.cpp`和`tail.cpp`，就是提交到后台编译运行服务的最终代码。

#### Model模块

`Model`模块负责数据处理功能，大致框架如下：

```cpp
struct Problem
{
    std::string _number;     // 题目编号
    std::string _title;      // 题目标题
    std::string _desc;       // 题目描述
    std::string _difficulty; // 题目难度 简单 中等 困难

    int _cpu_limit;          // 题目的时间要求
    int _mem_limit;          // 题目的空间要求

    std::string _header;     // 题目的预设代码
    std::string _tail;       // 题目的测试用例
};
const std::string problem_list = "./problem_set/problems.list";

class Model
{
    public:
    Model();

    // 加载题库列表文件和所有题目文件
    bool LoadProblemList(const std::string& question_list);
    void GetAllProblems(std::vector<Problem>* out);
    void GetOneProblems(const std::string& problem_number, Problem* problem);

    ~Model();

    private:
    std::unordered_map<std::string, Problem> _problem_set; // 题号和题目内容的映射
};
```

#### Control模块

`Control`模块为控制器，用来调用控制`Model`和`View`模块的。

```cpp
class Controller
{
    private:
    Model _model;
    View _view;

    public:
    Controller();
    // 构建题库网页
    bool GetAllQuestionsHtml(std::string* html);
    // 构建题目编辑网页
    bool GetOneQuestionHtml(const std::string& number, std::string* html);
    ~Controller();
};
```

而它本身又是被`oj_server`所调用。用来调用我们对应的一些功能。

```cpp
Server svr;
Controller ctrl;

/* 获取题库列表 */
svr.Get("/all_questions", [&ctrl](const Request& req, Response& rsp) {
    std::string html;
    ctrl.GetAllQuestionsHtml(&html);
    rsp.set_content(html, "text/html; charset=utf-8");
});

/* 根据题号获取题目内容 */
// /questions/10 正则表达式匹配
svr.Get(R"(/question/(\d+))", [&ctrl](const Request& req, Response& rsp) {
    std::string question_number = req.matches[1];
    std::string html;
    ctrl.GetOneQuestionHtml(question_number, &html);
    rsp.set_content(html, "text/html; charset=utf-8");
});

/* 提交代码，使用编译运行服务 */
svr.Get(R"(/judge/(\d+))", [&ctrl](const Request& req, Response& rsp){
    //...
});
```

[跳转到`judge`编译运行服务功能实现处](#judge)

> judge编译运行服务功能需要先实现View模块，不影响实现思路，我们将该模块的实现放到下面。

#### View模块

`View`模块就是用来构建一些网页的，`Control`模块中构建网页的方法就是调用这里的。

渲染网页我们选择用谷歌的`ctemplate`开源库。`ctamplate`需要我们提供`json`串和`html`网页骨架。

- `json`串就是保存数据的数据字典，也就是一个一个的`kv`结构。
- 原始网页内容包含`json`串中的`key`值，ctemplate所作的渲染就是将`key`值对应的`value`导入到网页中。

<img src="https://img.gejiba.com/images/cc5dc77678456769eb40041cf8c10949.png" style="zoom:50%;"  >

```cpp
class View
{
    public:
    View()
    {}
    ~View()
    {}
    // 题库列表只需显示题目编号、题目标题、题目难度
    void ExpandAllQuestionsHtml(const std::vector<Question> questions, std::string* html)
    {
        std::string src_html = template_path + "all_questions.html"; // 路径
        // 形成数据字典
        TemplateDictionary root("all_questions");
        for (const auto& q : questions)
        {
            TemplateDictionary* sub =root.AddSectionDictionary("questions_list");
            sub->SetValue("number", q._number);
            sub->SetValue("title", q._title);
            sub->SetValue("difficulty", q._difficulty);
        }

        // 获取被渲染的网页
        Template* tpl = Template::GetTemplate(src_html, DO_NOT_STRIP);

        tpl->Expand(html, &root); // 开始渲染
    }

    void ExpandOneQuestionHtml(Question question, std::string* html)
    {
        // 路径
        std::string src_html = template_path + "one_question.html";
        // 形成数据字典
        TemplateDictionary root("one_question");
        root.SetValue("number", question._number);
        root.SetValue("title", question._title);
        root.SetValue("difficulty", question._difficulty);
        root.SetValue("desc", question._desc);
        root.SetValue("header_code", question._header);

        // 获取被渲染的网页
        Template* tpl = Template::GetTemplate(src_html, DO_NOT_STRIP);
        //
        tpl->Expand(html, &root);
    }
};
```

待渲染的网页如下所示：

```html
<!-- all_question -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Online Judge - question list</title>
</head>
<body>
    <table>
        <tr>
            <th>编号</th>
            <th>标题</th>
            <th>难度</th>
        </tr>
        {{#questions_list}}
        <tr>
            <td>{{number}}</td>
            <!-- 题目跳转链接 -->
            <td><a href="/question/{{number}}">{{title}}</a></td>
            <td>{{difficulty}}</td>

        </tr>
        {{/questions_list}}
    </table>
</body>
</html>
```

```html
<!-- one_question -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{number}}.{{title}}</title>
</head>
<body>
    <h4>{{number}}.{{title}}.{{difficulty}}</h4>
    <p>{{desc}}</p>
    <!-- 代码编辑区 -->
    <textarea name="" id="" cols="30" rows="10">{{header_code}}</textarea>
</body>
</html>
```

放到指定目录下，由`View`模块调用，最后后由`oj_server`中的`Control`模块调用。

&nbsp;

#### 负载均衡功能

负载均衡首先我们要有关于服务主机的配置类，负载均衡功能类。此外，我们可以在目录下新建`server.conf`作为服务主机的配置文件。

```cpp
// 编译服务主机
struct Server
{
    std::string _ip;
    int _port;
    std::atomic<uint64_t> _load_factor; // 服务主机的负载情况

    Server() : _ip(""), _port(-1), _load_factor(0)
    {}
    ~Server()
    {}

    void IncFactor() {
        _load_factor++;
    }

    void DecFactor() {
        _load_factor--;
    }

    uint64_t GetFactor() {
        return _load_factor;
    }
};

// 负载均衡模块
class LoadBalance
{
    public:
    LoadBalance()
    {
        assert(LoadConf());
        LOG(INFO) << "load severs conf success\n";
    }
    ~LoadBalance()
    {}

    public:
    bool LoadConf();

    // 智能选择服务主机
    bool SmartSelection(int* id, Server** server)
    {
        std::lock_guard<std::mutex> lck(_mtx); // 维护负载选择的线程安全

        // 轮询检测
        int online_num = _online_svrs.size(); // 获取在线主机的个数
        if (online_num == 0)
        {
            LOG(FATAL) << "all server machines are offlined now, please check them\n";
            return false;
        }

        // 挑选负载最小的服务主机
        uint64_t min_load = _servers[_online_svrs[0]].GetFactor();
        *id = _online_svrs[0];
        *server = &_servers[_online_svrs[0]];

        for (int i = 0; i < online_num; i++)
        {
            uint64_t cur_load = _servers[_online_svrs[i]].GetFactor();
            if (min_load > cur_load)
            {
                min_load = cur_load;
                *id = _online_svrs[i]; // 获取该主机id
                *server = &_servers[_online_svrs[i]]; //获取该主机类地址
            }
        }
        return true;
    }

    //...
};
```

#### <a id="judge">Judge功能实现</a>

Control 模块 Judge 功能实现的是向用户提供包装后的编译运行功能。

1. 根据题号获取该题目的信息；
2. 反序列化in_json，获取用户代码汇总用户代码和测试用例，形成compile_string；
3. 负载均衡选择好后台编译服务主机，并作客户端对该主机发起http请求；
4. 获取编译服务返回的json串，在返回给上层。

```cpp
// in_json
//   "code": "#incude...",
//   "input": "...",
void Judge(const std::string& number, const std::string& in_json, std::string* out_json)
{

    Question question;
    _model.GetOneQuestion(number, &question); // 根据编号获取题目细节

    // 反序列化in_json，获取用户代码
    Json::Value in_value;
    Json::Reader reader;
    reader.parse(in_json, in_value);

    // 汇总用户代码和测试用例，形成compile_string
    Json::Value out_value;
    out_value["input"] = in_value["input"].asString();
    out_value["code"] = in_value["code"].asString() + question._tail;
    out_value["cpu_lim"] = question._cpu_limit;
    out_value["mem_lim"] = question._mem_limit;
    Json::StyledWriter writer;
    std::string compile_string = writer.write(out_value);

    // 负载均衡选择主机
    while (true) // 一直选择到可用主机，否则就是全部挂掉
    {
        int id = 0;
        Server* server = nullptr;
        if (!_load_balance.SmartSelection(&id, &server))
            break;

        LOG(INFO) << "select lowset load_factor server success, id :"
            << id << " ip: " << server->_ip << " port: " << server->_port << "\n";

        // 作客户端对后台编译运行服务发起http请求
        httplib::Client cli(server->_ip, server->_port);
        server->IncFactor();

        if (auto res = cli.Post(
            "/compile_and_run",
            compile_string, "application/json;charset=utf-8"))
        {
            if (res->status == 200) // http状态码为200
            {
                *out_json = res->body; // 获取编译服务返回json串
                server->DecFactor();

                LOG(INFO) << "judge mudel resquest compile_and_run service success\n";
                break;
            }
            server->DecFactor();
        }
        else // 请求失败
        {
            LOG(ERROR) << "request compile_and_run server failed, id: "
                << id << " ip: " << server->_ip << " port: " << server->_port
                << ", maybe this server is offlined\n";

            _load_balance.OfflineServer(id); // 记录离线主机id
            _load_balance.ShowOnlineSvrList(); // for debug
        }
    }
}
```

&nbsp;

## 3. 前端页面和数据库化

我们作为后端开发，只用三个前端网页即可，作用就是感受整体项目的一致性。

| 网页     | 功能                                                     |
| -------- | -------------------------------------------------------- |
| OJ首页   | 非常简单，只有一个跳转到题库列表的链接功能。             |
| 题库列表 | 利用表格的形式展示题库中所有的题目信息。                 |
| 题目编写 | 单个指定题目的详情展示和代码编写页面，具有代码提交功能。 |

对于前端，了解即可。相对重点关注前后端交互的部分。

### 3.1 OJ首页

```html
<!-- OJ首页 -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>OJ主页</title>
    <style>
        * {
            margin: 0px;
            padding: 0px;
        }
        html,
        body {
            width: 100%;
            height: 100%;
        }
        .container .navbar {
            width: 100%;
            height: 50px;
            background-color: #343333;
            overflow: hidden;
        }

        .container .navbar a {
            display: inline-block;
            width: 40px;
            color: #f5f5f7;
            font-size: 15px;
            font-family: "PingFang SC";
            line-height: 40px;
            text-decoration: none;
            margin-left: 10px;
        }

        .container .content {
            display: block;
            width: 800px;
            margin: 0px auto;
            text-align: center;
            text-decoration: none;
            font-size: larger;
            font-family: "PingFang SC";
            line-height: 50px;
            margin-top: 200px;
        }

        .container .content p {
            text-decoration: none;
            font-size: 17px;
        }

        .container .content a {
            text-decoration: none;
            font-size: 17px;
        }
    </style>
</head>

<body>
    <div class="container">

        <!-- 导航栏 -->
        <div class="navbar">
            <a href="#">首页</a>
            <a href="#">题库</a>
            <a href="#">学习</a>
            <a href="#">竞赛</a>
            <a href="#">讨论</a>
            <a href="#">求职</a>
            <a href="#">登录</a>
        </div>

        <!-- 网页内容 -->
        <div class="content">
            <h2>欢迎来到我的OJ在线编程平台</h2>
            <p>由开发者yyo独立开发的一款在线判题平台</p>
            <a href="/all_questions">点我开始编写题目啦</a>
        </div>
    </div>
</body>

</html>
```

### 3.2 题库列表

<img src="https://img.gejiba.com/images/9cb21fd09376141b27d5ed3567a33cdd.png" a style="zoom:50%;" >

```html
<!-- 题库列表 -->
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Online Judge - question list</title>
    <style>
        * {
            margin: 0px;
            padding: 0px;
        }

        html,
        body {
            width: 100%;
            height: 100%;
        }

        .container .navbar {
            width: 100%;
            height: 50px;
            background-color: #343333;
            overflow: hidden;
        }

        .container .navbar a {
            display: inline-block;
            width: 40px;
            color: #f5f5f7;
            font-size: 15px;
            font-family: "PingFang SC";
            line-height: 40px;
            text-decoration: none;
            margin-left: 10px;
        }

        .container .questions_list {
            padding-top: 30px;
            width: 800px;
            height: 100%;
            margin: 0px auto;
            font-family: "PingFang SC";
            text-align: center;
        }

        /* .container .questions_list h1 {} */

        .container .questions_list table {
            padding-top: 20px;
            width: 100%;
            font-size: large;
            background-color: rgb(250, 250, 250);
        }

        .container .questions_list table .item {
            width: 100px;
            height: 30px;
            padding-top: 10px;
            font-size: large;
        }

        .container .questions_list table .item a {
            text-decoration: none;
            color: black;

        }

        .container .questions_list table .item a:hover {
            color: #3478F6;
        }

        .footer {
            margin-top: 150px;
            width: 100%;
            height: 50px;
            line-height: 50px;
            text-align: center;
            color: #9d9d9d;
            background-color: #fbfbfb;
            font-family: "PingFang SC";
        }
    </style>
</head>

<body>
    <div class="container">

        <!-- 导航栏 -->
        <div class="navbar">
            <a href="/">首页</a>
            <a href="/all_questions">题库</a>
            <a href="#">学习</a>
            <a href="#">竞赛</a>
            <a href="#">讨论</a>
            <a href="#">求职</a>
            <a href="#">登录</a>
        </div>

        <div class="questions_list">
            <h1>Online Judge 全部题目</h1>
            <table>
                <tr>
                    <th class="item">编号</th>
                    <th class="item">标题</th>
                    <th class="item">难度</th>
                </tr>
                {{#questions_list}}
                <tr>
                    <td class="item">{{number}}</td>
                    <!-- 题目跳转链接 -->
                    <td class="item"><a href="/question/{{number}}">{{title}}</a></td>
                    <td class="item">{{difficulty}}</td>

                </tr>
                {{/questions_list}}
            </table>
        </div>

    </div>

    <div class="footer">
        <hr style="opacity:0.4;">
        <p>@yourfriendyo</p>

    </div>
</body>

</html>
```

### 3.3 题目编写

<img src="https://img.gejiba.com/images/ce89f5ae08c922f8e6bba84c2bb5b233.png" style="zoom:50%;" >

网页编写代码的话，我们可以使用ACE在线代码编辑器。

原生js较为复杂，我们使用更简单的JQuery框架，来进行我们的前后端交互。

```html
<!-- 题目编写 -->
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{number}}.{{title}}</title>
    <!-- 引入ACE CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.6/ace.js" type="text/javascript"
        charset="utf-8"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.6/ext-language_tools.js" type="text/javascript"
        charset="utf-8"></script>
    <!-- 引入jquery CDN -->
    <script src="http://code.jquery.com/jquery-2.1.1.min.js"></script>

    <style>
        * {
            margin: 0;
            padding: 0;
        }

        html,
        body {
            width: 100%;
            height: 100%;
        }

        .container .navbar {
            width: 100%;
            height: 50px;
            background-color: #343333;
            overflow: hidden;
        }

        .container .navbar a {
            display: inline-block;
            width: 40px;
            color: #f5f5f7;
            font-size: 15px;
            font-family: "PingFang SC";
            line-height: 40px;
            text-decoration: none;
            margin-top: 5px;
            margin-left: 10px;
        }

        .container .navbar a:hover {
            font-weight: bold;
        }

        .container .part1 {
            width: 100%;
            height: 600px;
            overflow: hidden;
        }

        .container .part1 .left_desc {
            width: 50%;
            height: 600px;
            float: left;
            overflow: scroll;
        }

        .container .part1 .left_desc h3 {
            padding-top: 10px;
            padding-left: 10px;
        }

        .container .part1 .left_desc pre {
            padding-top: 10px;
            padding-left: 10px;
            font-size: medium;
            font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        }

        .container .part1 .right_code .ace_text-input {
            width: 50%;
            float: right;
            font-family: 'Courier New', 'Gill Sans', 'Gill Sans MT', 'Trebuchet MS', sans-serif;
        }

        .container .part1 .right_code .ace_editor {
            height: 600px;
        }

        .container .part2 {
            width: 100%;
            overflow: hidden;
        }

        .container .part2 .result {
            width: 300px;
            float: left;
        }

        .container .part2 .btn-submit {
            width: 120px;
            height: 50px;
            font-size: large;
            float: right;
            background-color: #26bb9c;
            color: #FFF;
            border: 0px;
            margin-top: 10px;
            margin-right: 10px;
        }

        .container .part2 button:hover {
            color: green;
        }

        .container .part2 .result {
            margin-top: 15px;
            margin-left: 15px;
            font-size: large;
            font-family: 'Dejavu Sans Mono', 'Courier New';
        }

        .container .part2 .result pre {
            font-size: medium;
        }
    </style>
</head>

<body>
    <div class="container">
        <!-- 导航栏， 功能不实现-->
        <div class="navbar">
            <a href="/">首页</a>
            <a href="/all_questions">题库</a>
            <a href="#">竞赛</a>
            <a href="#">讨论</a>
            <a href="#">求职</a>
            <a href="#">登录</a>
        </div>

        <!-- 左右呈现，题目描述和预设代码 -->
        <div class="part1">
            <div class="left_desc">
                <h3><span id="number">{{number}}</span> . {{title}} _ {{difficulty}}</h3>
                <pre>{{desc}}</pre>
            </div>
            <div class="right_code">
                <pre id="code" class="ace_editor"><textarea class="ace_text-input">{{header_code}}</textarea></pre>
            </div>
        </div>

        <!-- 提交并且得到结果，并显示 -->
        <div class="part2">
            <div class="result"></div>
            <button class="btn-submit" onclick="submit()">提交代码</button>
        </div>

    </div>

    <script>
        //初始化对象
        editor = ace.edit("code");

        editor.setTheme("ace/theme/monokai");
        editor.session.setMode("ace/mode/c_cpp");

        // 字体
        editor.setFontSize(15);
        editor.getSession().setTabSize(4);
        editor.setReadOnly(false);

        // 启用提示菜单
        ace.require("ace/ext/language_tools");
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true
        });

        // 提交信息
        function submit() {
            //1. 收集数据，题号和代码
            var code = editor.getSession().getValue();
            var number = $(".container .part1 .left_desc h3 #number").text();

            //2. 构建json，通过ajax并向后台发起请求
            var judge_url = "/judge/" + number;
            $.ajax({
                method: 'Post',
                url: judge_url,
                dataType: 'json', // 告知后端需要的数据格式

                contentType: 'application/json; charset=utf-8', // 向后端发送的数据格式
                data: JSON.stringify({
                    'code': code,
                    'input': ''
                }),

                //3. 得到后台结果，显示到前端页面中
                success: function (data) // 交互成功后执行的回调函数
                {
                    show_result(data);
                }
            });
        }

        function show_result(data) {
            var result_div = $(".container .part2 .result");

            var reason_div = $("<p>", {
                text: data.reason
            });
            reason_div.appendTo(result_div);

            if (data.status == 0) {
                var stdout_lable = $("<pre>", {
                    text: data.stdout
                });
                stdout_lable.appendTo(result_div);

                var stderr_lable = $("<pre>", {
                    text: data.stderr
                });
                stdout_lable.appendTo(result_div);
            }
            else { } // 编译失败
        }

    </script>
</body>
</html>
```

### 3.4 数据库化

原本我们的题库采用的是文件的形式存储在项目目录下的：

```shell
oj_server
└── questions_all      # 题库中每个题目的配套文件
    ├── 1
    │   ├── desc.txt
    │   ├── header.cpp
    │   └── tail.cpp
    ├── 2
    │   ├── desc.txt
    │   ├── header.cpp
    │   └── tail.cpp
    └── questions.conf
    │
    └──  # ...
```

> 现在我们要将其放到数据库中，摆脱对文件的依赖。我会保留一个文件版`oj_server_file_version`板块。

首先我们要有一个能够远程登录的MySQL用户，然后我们就可以设计表结构并开始编码。不过目前项目整体难度已经不小且成本不低，所以我们计划用一张表`oj_questions`就完成数据库化的任务。

```sql
create user oj_client@'%' identified by 'OJoj_123456';
create database oj;
use oj;
grant all on oj.* to oj_client@'%';
```

我们将`question.conf`题库列表文件和`questions_all/(+d)`单个题目的相关文件设计到一张表中。

执行下面sql语句构建和填充库表。

````sql
use oj;

create table if not exists `oj_questions` (
	`number` int primary key auto_increment comment '题目编号',
	`title` varchar(128) NOT NULL comment '题目标题',
	`difficulty` varchar(8) NOT NULL comment '题目难度',
	`dsec` text NOT NULL comment '题目描述',
	`header` text NOT NULL comment '题目预设代码',
	`tail` text NOT NULL comment '题目测试用例代码',
	`cpu_lim` int default 1 comment '题目的cpu时间',
	`mem_lim` int default 40960 comment '题目的内存限制'
)engine=InnoDB default charset=utf8;

desc oj_questions;

INSERT INTO oj.oj_questions
(`number`, title, difficulty, dsec, header, tail, cpu_lim, mem_lim)
VALUES(1, '两数之和', '简单', '给定一个整数数组`nums`和一个整数目标值 `target`，请你在该数组中找出**和为目标值**`target`的那**两个**整数，并返回它们的数组**下标**。

你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。

你可以按任意顺序返回答案。

示例 1：
```
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。
```

示例 2：
```
输入：nums = [3,2,4], target = 6
输出：[1,2]
```

示例 3：
```
输入：nums = [3,3], target = 6
输出：[0,1]
```

提示：

```
2 <= nums.length <= 104
-109 <= nums[i] <= 109
-109 <= target <= 109
```

只会存在一个有效答案

进阶：你可以想出一个时间复杂度小于 O(n2) 的算法吗？', '#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // coding here...

    }
};', '// g++ -D COMPILER_SERVER 编译代码时加宏定义即可去掉下面调包含语句
#ifndef COMPILER_SERVER
#include "header.cpp"
#endif

void Test1()
{
    vector<int> nums = { 2,7,11,15 };
    vector<int> ret = Solution().twoSum(nums, 9);
    if (find(ret.begin(), ret.end(), 0) != ret.end() &&
        find(ret.begin(), ret.end(), 1) != ret.end())
    {
        std::cout << "通过测试用例1" << std::endl;
    }
    else
    {
        std::cout << "测试用例1失败" << std::endl;
    }
}

void Test2()
{
    vector<int> nums = { 3,2,4 };
    vector<int> ret = Solution().twoSum(nums, 6);
    if (find(ret.begin(), ret.end(), 2) != ret.end() &&
        find(ret.begin(), ret.end(), 4) != ret.end())
    {
        std::cout << "通过测试用例2" << std::endl;
    }
    else
    {
        std::cout << "测试用例2失败" << std::endl;
    }
}

void Test3()
{
    vector<int> nums = { 3,3 };
    vector<int> ret = Solution().twoSum(nums, 6);
    if (find(ret.begin(), ret.end(), 0) != ret.end() &&
        find(ret.begin(), ret.end(), 1) != ret.end())
    {
        std::cout << "通过测试用例1" << std::endl;
    }
    else
    {
        std::cout << "测试用例1失败" << std::endl;
    }
}

int main()
{
    Test1();
    Test2();
    Test3();

    return 0;
}', 1, 30720);

INSERT INTO oj.oj_questions
(`number`, title, difficulty, dsec, header, tail, cpu_lim, mem_lim)
VALUES(2, '求最大值', '简单', '输入10个整数，要求输出其中的最大值。

输入描述:

测试数据有多组，每组10个整数。

输出描述:

示例1

输入：10 22 23 152 65 79 85 96 32 1

输出：max=152', '#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

class Solution
{
public:
    int Max(const vector<int>& nums)
    {
        //coding here...

    }
};', '// g++ -D COMPILER_SERVER 编译代码时加宏定义即可去掉下面调包含语句
#ifndef COMPILER_SERVER
#include "header.cpp"
#endif

void Test1()
{
    vector<int> nums = { 10,22,23,152,65,79,85,96,32,1 };
    if (Solution().Max(nums) == 152)
        std::cout << "测试用例1通过" << std::endl;
    else
        std::cout << "测试用例1失败" << std::endl;
}

void Test2()
{
    vector<int> nums = { 2,34,5,243,351,412,2,8,56,89,138, };
    if (Solution().Max(nums) == 412)
        std::cout << "测试用例2通过" << std::endl;
    else
        std::cout << "测试用例2失败" << std::endl;
}

int main()
{
    Test1();
    Test2();

    return 0;
}', 1, 40960);
````

#### 代码连接MySQL

##### 安装环境

要想使用C/C++的MySQL接口，必须使用MySQL提供的库。如果当初是用yum安装MySQL的直接就有。

<img src="https://img.gejiba.com/images/0e99187e24b6a23ff917f76efcc905fa.png" style="zoom:50%;" >

如果没有目录`/usr/include/mysql`，可以安装如下两个程序

```shell
$ rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022 # 如果出现GPG key不匹配的问题
$ yum install -y libodb-mysql-devel.x86_64
$ yum install -y soci-mysql-devel.x86_64
```

链接静态库的时候，要指明库名和路径。

```makefile
mysql_test:mysql_test.cc
        g++ -o $@ $^ -lmysqlclient -L/usr/lib64/mysql -std=c++11
```

> 这里有一个坑，库所在路径一定要指明`/usr/lib64/mysql`，如果找不到的话。

我们的oj服务是基于MVC模式的，所以我们只需要改动`oj_model.hpp`即可。接口定义不变，只改变中各实现即可。

```cpp
#pragma once
#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <fstream>
#include <mutex>
#include <cassert>
#include <mysql/mysql.h>
#include "../comm/log.hpp"
#include "../comm/util.hpp"

// oj_model.hpp 提供数据交互访问题目的模块功能
namespace NS_Model
{
    using namespace NS_Log;
    using namespace NS_Util;

    struct Question
    {
        std::string _number;     // 题目编号
        std::string _title;      // 题目标题
        std::string _desc;       // 题目描述
        std::string _difficulty; // 题目难度 简单 中等 困难

        std::string _header;     // 题目的预设代码
        std::string _tail;       // 题目的测试用例

        int _cpu_limit;          // 题目的时间要求
        int _mem_limit;          // 题目的空间要求
    };

    const std::string tb_name = "oj_questions";
    const char* host = "127.0.0.1";
    const char* user = "oj_client";
    const char* passwd = "OJoj123456";
    const char* db_name = "oj";
    const int port = 3306;

    //MYSQL* _mysql_conn = nullptr;
    class Model
    {
    private:
        std::mutex mtx;
        MYSQL* _mysql_conn = nullptr;

    public:
        Model()
        {
            if (_mysql_conn == nullptr)
            {
                std::lock_guard<std::mutex> lck(mtx);
                if (_mysql_conn == nullptr)
                {
                    _mysql_conn = mysql_init(nullptr);

                    // 连接数据库
                    if (mysql_real_connect(_mysql_conn,
                        host, user, passwd, db_name, port, nullptr, 0) == nullptr)
                    {
                        LOG(FATAL) << "connect mysql failed\n";
                    }
                    LOG(INFO) << "connect mysql success\n";

                    mysql_set_character_set(_mysql_conn, "utf8");
                }
            }
        }

        ~Model()
        {
            mysql_close(_mysql_conn);
        }

        bool QueryMysql(const std::string& sql, std::vector<Question>* out)
        {
            if (mysql_query(_mysql_conn, sql.c_str()) != 0)
            {
                LOG(WARNING) << sql << " execute error\n";
                return false;
            }

            // 提取结果
            MYSQL_RES* res = mysql_store_result(_mysql_conn);

            int rows = mysql_num_rows(res);   // 行数
            for (int i = 0; i < rows; i++)
            {
                MYSQL_ROW row = mysql_fetch_row(res);

                Question q;
                q._number = row[0];
                q._title = row[1];
                q._difficulty = row[2];
                q._desc = row[3];
                q._header = row[4];
                q._tail = row[5];
                q._cpu_limit = atoi(row[6]);
                q._mem_limit = atoi(row[7]);

                out->push_back(q);
            }

            mysql_free_result(res);
            return true;
        }

        bool GetAllQuestions(std::vector<Question>* out)
        {
            std::string sql = "select * from " + tb_name;
            return QueryMysql(sql, out);
        }

        bool GetOneQuestion(const std::string& number, Question* question)
        {
            std::vector<Question> res;
            std::string sql = "select * from " + tb_name += " where number=" + number;
            if (QueryMysql(sql, &res))
            {
                if (res.size() == 1)
                    *question = res[0];
                else
                    return false;
            }
            return true;
        }
    };
}
```

&nbsp;

## 4. 项目总结和项目扩展

### 项目亮点

- 使用多个知名的开源库，如`Boost`、`cpp-httplib`、`ctemplate`、`jsoncpp`。
- 良好的负载均衡方案设计。
- 支持多进程和多线程。

- 有一定的前端技术美化项目。

### 项目扩展

1. 附带注册登录的录题功能；
2. 接入社区功能或者博客系统；
3. 把编译服务部署在docker上；
4. 将编译服务包装成远程过程调用服务`rest_rpc`替换http服务。
5. 丰富做题界面的功能，如下一题按钮。
