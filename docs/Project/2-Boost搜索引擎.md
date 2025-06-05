# BoostSearch搜索引擎

## 1. 项目的相关背景

> 研发搜索引擎的公司，如百度、搜狗、360搜索，还有各大网站各种客户端也提供搜索功能。
>
> Boost官方网站是没有搜索功能的，所以我们为Boost实现一个站内搜索引擎。

自行实现一个全网搜索引擎难度极大，是十分困难的，但是实现站内搜索，也就是只搜索网站内的内容，这样搜索的内容更垂直，数据量更小，也可以达到以小见大的效果。

对于搜索结果，基本包含三个部分：网页标题、网页内容摘要、目标网页地址。

<img src="https://img.gejiba.com/images/f29d5b97db5c9f1445096530f5fc4630.png" alt="搜索结果组成图示" border="0" style="zoom: 50%;" >

> 对于图片，视频等的展示，暂不考虑。

## 2. 搜索引擎的相关宏观原理

<img src="https://img.gejiba.com/images/20cfb315081a44ba6f0e501ef973ba68.png" alt="搜索引擎宏观实现原理" border="0" style="zoom: 50%;" >

## 3. 相关技术栈和项目环境

### 3.1 技术栈

- 后端：C/C++，C++11，STL，Boost标准库，Jsoncpp，cppjieba，cpp-httplib，
- 前端：html5，jQuery，Ajax

### 3.2 项目环境

Centos7云服务器，vim/gcc(g++)/Makefile，vscode

&nbsp;

## 4. 搜索引擎的具体原理

### 4.1 正排索引和倒排索引

搜索引擎必然要对内容建立索引，才能更快的搜索和返回。有两种索引：正排索引和倒排索引。以如下内容举例：

> 有如下两个文档，我们对这两个文档内容建立索引：
>
> - 文档1：雷军买了四斤小米
> - 文档2：雷军发布了小米手机

建立索引本质就是建立文档内容和文档ID的关系。

#### 正排索引

| 文档ID | 文档内容           |
| ------ | ------------------ |
| 1      | 雷军买了四斤小米   |
| 2      | 雷军发布了小米手机 |

**正排索引就是从文档ID找到文档内容（文档内的关键字）**。

#### 分词

我们拿到文档首先要对其编号，其次**对文档内容进行分词，也就是得到文档内的关键字，为的是建立倒排索引和方便查找**。

- 文档1：雷军买了四斤小米：雷军/买/了/四斤/小米/四斤小米
- 文档2：雷军发布了小米手机：雷军/发布/了/小米/小米手机

> 其中对于“了”、“呢”、“的”、“啊”，这些词都被称为停止词或暂停词。这些词对我们建立索引是没有意义的，在分词的时候都会被去掉。

#### 倒排索引

倒排索引就是根据文档内容，进行分词，整理具有唯一性不重复的关键字。再根据关键字找到关联文档ID的方案。

| 关键字（具有唯一性） | 文档ID |
| -------------------- | ------ |
| 雷军                 | 1，2   |
| 买                   | 1      |
| 四斤                 | 1      |
| 小米                 | 1，2   |
| 四斤小米             | 1      |
| 发布                 | 2      |
| 小米手机             | 2      |

模拟一次查找过程：

1. 用户输入：小米
2. **在倒排索引中查找，提取出文档ID (1, 2)**
3. **根据正排索引，找到文档内容**
4. 获取文档的标题、内容、描述、URL
5. 对文档结果进行摘要
6. 构建响应并返回

> 大搜索引擎会对文档附加权重属性，以决定该文档内容展示的优先级。

### 4.2 认识标签和去标签

https://www.boost.org

将 boost_1_78_0/doc/html 中的数据作为需要建立索引的数据源。

#### 去标签

现在我们首先将数据源中的各个文档去标签化。HTML 是标签化语言，所有的语句都被一对标签包裹起来，由左右尖括号括起来的就是标签，对数据本身是无意义的，所以我们首先要将其去掉。

一般标签都是成对出现的，标签中的属性信息也是不需要的，只有标签内的数据是有用数据。

```html
<title>Chapter 37. Boost.STLInterfaces</title>

<link rel="stylesheet" href="../../doc/src/boostbook.css" type="text/css">

<td align="center"><a href="../../index.html">Home</a></td>
```

目标是：把每个文档都进行去标签，清洗后写到同一个文件中，每个文档的内容用`\3`分隔。`\3`是不可显的控制字符，不会污染净化后的数据。

&nbsp;

## 5. 数据清洗的模块

### 5.1 大致框架

数据清洗模块框架大致如此：

1. 遍历网页文件目录下的所有html文件获取上来并进行解析，
2. 把解析后的数据放到清洗后数据存放位置。

```cpp
const std::string src_path = "data/input/"; // html网页数据源路径
const std::string output = "data/output/raw.bin"; // 文档数据清洗保存路径

bool EnumFiles(const std::string& src_path, std::vector<std::string>* file_list);
bool ParseFiles(std::vector<std::string>& file_list, std::vector<DocInfo>* parser_res);
bool SaveFiles(const std::vector<DocInfo>& parser_res, const std::string& output);
// 获取到的文件，解析其相关属性
struct DocInfo {
    std::string title;       // 文档标题
    std::string content;     // 文档内容
    std::string url;         // 文档地址
};
int main()
{
    std::vector<std::string> file_list; // 保存所有文件名
    // 递归遍历所有数据源文件，将文件名保存到file_list中，以便后期读取
    if (!EnumFiles(src_path, &file_list)) {
        std::cerr << "enum file error" << std::endl;
        exit(1);
    }
    // 读取每个文件的内容，并进行解析
    std::vector<DocInfo> parser_res;
    if (ParseFiles(file_list, &parser_res)) {
        std::cerr << "enum file error" << std::endl;
        exit(2);
    }
    // 把解析得到的内容写入到output中，以\3作为每个文档内容的分隔符
    if (!SaveFiles(parser_res, output)) {
        std::cerr << "save file error" << std::endl;
        exit(3);
    }
    return 0;
}
```

C++库对文件系统的支持并不是很好，所以我们采用boost库的文件操作API。

> centos安装boost开发库：
>
> ```shell
> $ sudo yum install -y  boost-devel
> ```

### 5.2 遍历文件

```cpp
bool EnumFiles(const std::string& src_path, std::vector<std::string>* file_list)
{
    namespace fs = boost::filesystem;
    fs::path root_path(src_path); // 定义路径对象
    if (!fs::exists(root_path)) {
        std::cerr << src_path << " is not exists" << std::endl;
        return false;
    }
    // 定义对象迭代器对象
    fs::recursive_directory_iterator end;
    for (fs::recursive_directory_iterator iter(root_path); iter != end; iter++)
    {
        if (!fs::is_regular_file(*iter)) {            // 判断是否为普通文件
            continue;
        }
        if (iter->path().extension() != ".html") {    // 判断后缀是否为html
            continue;
        } // 当前的路径一定是一个合法文件路径

        file_list->push_back(iter->path().string());  // 文件路径放到file_list中
    }
    return true;
}
```

### 5.3 解析文件

#### 大致框架

先读取文件，再依次解析文件的 title、content、url，解析成功后拷贝至解析结果数组中。

```cpp
bool ParseFiles(const std::vector<std::string>& file_list, std::vector<DocInfo>* parser_res)
{
    for (auto& file : file_list)
    {
        //读取文件
        std::string result; // 读取的结果
        if (!Util::ReadFile(file, &result)) {
            continue;
        }
        // 解析文件
        DocInfo info;
        // title
        if (!ParserTitle(result, &info._title)) {
            continue;
        }
        // content
        if (!ParserContent(result, &info._content)) {
            continue;
        }
        // url
        if (!ParserUrl()) {
            continue;
        }
        // 当前文档解析完毕，属性在info中，导入parser_res
        parser_res->push_back(info); // 拷贝，低效
    }
    return true;
}
```

#### 提取title

```html
<title>Redirect to generated documentation</title>
```

```cpp
static bool ParserTitle(const std::string& file, std::string* title)
{
    std::size_t begin = file.find("<title>"); // 查找字符串<title>
    if (begin == std::string::npos) {
        return false;
    }
    std::size_t end = file.find("</title>"); // 查找字符串</title>
    if (end == std::string::npos) {
        return false;
    }

    begin += std::string("<title>").size(); // 指向title位置
    if (begin > end)
        return false;

    *title = std::string(begin, end);

    std::cout << "title: " << title << std::endl;

    return true;
}
```

#### 提取content

遍历html文件内容时，只要碰到`>`就意味着当前标签被处理完毕，只要碰到`<`就意味着即将处理新标签。

用枚举类型描述这俩种状态，条件就绪更改状态，遇到内容时就插入到对应字符串中。

```cpp
bool ParserContent(const std::string& file, std::string* content)
{
    //去标签，基于一个简易的状态机编写
    enum STATUS {
        LABLE,
        CONTENT
    };
    enum STATUS s = LABLE;
    for (char c : file) {
        switch (s) {
        case LABLE:
            if (c == '>') s = CONTENT;   // 可能进入读内容模式
            break;
        case CONTENT:
            if (c == '<') s = LABLE;     // 可能进入读标签模式
            else {
                // 处理掉原始内容中的\n，将其留作html解析之后的文本分隔符
                if (c == '\n') c = '\0';
                content->push_back(c);   //
            }
            break;
        default:
            std::cout << "unkown status" << std::endl;
            break;
        }
    }
    return true;
}
```

#### 构建URL

boost库的官方文档和我们项目中的文档数据源，当然是可以对应起来的。构建一下即可。

```html
https://www.boost.org/doc/libs/1_80_0/doc/html/*
/home/yyx/Project/BoostSearch/data/input/*
```

```cpp
bool ParserUrl(const std::string& file, std::string* url)
{
    std::string url_head = "https://www.boost.org/doc/libs/1_80_0/doc/html/"; // 构建前缀

    int begin = file.rfind('/');
    if (begin == std::string::npos) {
        std::cout << "file suffix find error" << std::endl;
        return false;
    }

    std::string url_tail(file, begin + 1);
    *url = url_head + url_tail;

    return true;
}
```

### 5.4 数据保存

> 之前我们我们确定的解析目标是将所有文件的属性信息（title、content、url）保存在`unq.bin`中，每个文档的属性以`\3`分隔。

```cpp
title\ncontent\nurl\n \3 title\ncontent\nurl\n \3 title\ncontent\nurl\n \3
```

但为使用`getline`一次读取一行能够直接获得一个文档的所有属性信息，我们现将分隔符修改一下：

```cpp
title\3content\3url \n title\3content\3url \n title\3content\3url \n
```

```cpp
// 保存文件
bool SaveFiles(const std::vector<DocInfo>& parser_res, const std::string& output)
{
#define SEP '\3'
    std::ofstream ofs(output, std::ios::out | std::ios::binary); // 以二进制形式写入
    if (!ofs.is_open()) {
        std::cerr << "open " << output << " failed" << std::endl;
        return false;
    }
    // 遍历数据
    for (auto& e : parser_res)
    {
        std::string out_string(e._title + SEP + e._content + SEP + e._url + '\n');
        ofs.write(out_string.c_str(), out_string.size()); //写入文件
    }
    ofs.close();

    return true;
}
```

<img src="https://img.gejiba.com/images/a5228901ccb6ac7bf860ae7d9ec3c094.png" border="0">

> 结果如图所示：属性之间的分隔符是`\3`显示为`^C`。文档之间的分隔符是`\n`不显示。

&nbsp;

## 6. 建立索引的模块

### 6.1 大体框架

#### 正排索引

正排索引是建立文档ID和内容之间的联系所以用一个结构体`DocInfo`就可以存放相关信息。

```cpp
struct DocInfo
{
    std::string _title;    // 标题
    std::string _content;  // 内容
    std::string _url;      // 地址
    uint64_t _doc_id;      // 文档ID
};
```

保存的数据结构我们采用数组即可，使用数组的下标作为文档ID。

```cpp
// 正排索引的数据结构使用数组，用下标表示文档ID
std::vector<DocInfo> forward_index;  // 正排索引
```

#### 倒排索引

倒排索引建立关键字和多个其所在文档的相关信息的映射，相关信息有文档ID、文档中所有的关键字、权重等有关信息。

我们把这个相关信息封装在结构体`InvertedElem`中：

```cpp
struct InvertedElem
{
    int _doc_id;           // 文档ID
    std::string _word;     // 关键字
    int _weight;           // 权重
};
```

再通过哈希建立关键字和多个文档信息结构体的映射。我们将关键字所对应的多个文档信息结构体的集合叫做倒排拉链。

```cpp
// 倒排拉链
typedef std::vector<InvertedElem> InvertedList;
// 倒排索引一定是一个关键字和一组InvertedElem对象对应
std::unordered_map<std::string, InvertedList> inverted_index; // 倒排索引
```

#### 索引结构

```cpp
class Index {
    // 倒排拉链
    typedef std::vector<InvertedElem> InvertedList;
private:
    std::vector<DocInfo> forward_index;                           // 正排索引
    std::unordered_map<std::string, InvertedList> inverted_index; // 倒排索引
public:
    Index() {}
    ~Index() {}
    // 构建索引 -- 根据格式化后的文件名建立索引
    bool BuildIndex(const std::string& file_path);

    // 正排索引 -- 根据doc_id获得文档内容
    DocInfo* GetDocInfo(uint64_t doc_id);

    // 倒排索引 -- 根据关键字word获得倒排拉链
    InvertedList* GetInvertedList(const std::string& word);
};
```

1. 首先要建立索引，通过传递来的解析后的文档名，打开该文件并建立索引。
2. 正排索引的本质是通过文档ID获得文档内容，也就是`GetDocInfo`。
3. 倒排索引的本质是通过关键字获得对应的文档的相关信息，即倒排拉链，也就是`GetInvertList`。

### 6.2 具体实现

#### 正排倒排索引

正排索引倒排索引都是查找并返回对应数据结构中的一个节点。

```cpp
// 正排索引
DocInfo* GetDocInfo(uint64_t doc_id)
{
    if (doc_id >= _forward_index.size()) {
        std::cerr << "doc_id error out of range" << std::endl;
        return nullptr;
    }
    return &_forward_index[doc_id];
}
// 倒排索引
InvertedList* GetInvertedList(const std::string& word)
{
    auto iter = _inverted_index.find(word);
    if (iter == _inverted_index.end()) {
        std::cerr << "get invertedlist failed, invaild word" << std::endl;
        return nullptr;
    }
    return &(iter->second);
}
```

#### 构建索引

构建索引就是先获取到数据清洗之后的文件，把每个文档内容提取出来，建立正派和倒排索引。

```cpp
// 构建索引 -- 根据格式化后的文件名建立索引
bool BuildIndex(const std::string& file_path)
{
    std::ifstream ifs(file_path, std::ios::in | std::ios::binary); // 打开解析后的文件
    if (!ifs.is_open()) {
        std::cerr << "build index error, open " << file_path << " failed" << std::endl;
        return false;
    }
    std::string line; // 每个文件的内容占一行
    while (getline(ifs, line)) {
        DocInfo* info = BuildForwardIndex(line); // 建立正排索引
        if (info == nullptr) {
            std::cerr << "build line error, continue" << std::endl;  // for debug
            continue;
        }
        BuildInvertedIndex(*info); // 构建倒排索引
    }
    return true;
}
```

##### 建立正派索引

首先是建立正派索引，提取出每个文档的信息我们先划分出标题、内容、URL，再添加上文档ID一并打包放到正派索引数组中。

```cpp
private:
// 建立正排索引
DocInfo* BuildForwardIndex(const std::string& line)
{
    // 解析line字符串
    std::string sep("\3"); // 行内分隔符
    std::vector<std::string> info_result; // 单行解析结果存储位置
    Util::CutString(line, &info_result, sep);

    if (info_result.size() != 3) {
        return nullptr;
    }
    // 切分后放到Docinfo结构体
    DocInfo info;
    info._title = info_result[0];
    info._content = info_result[1];
    info._url = info_result[2];
    info._doc_id = _forward_index.size();
    // 放到正排数组vector中
    _forward_index.push_back(std::move(info));
    return &(_forward_index.back());
}
```

##### 构建倒排索引

然后就是构建倒排索引，提取出文档信息后，

1. 将文档的标题、内容拿出来，进行分词，分出多个关键词；
2. 在遍历分出来的关键字，进行词频统计，计算词和文档的相关性；

> 分词工具我们采用jieba分词工具。需要将deps下的limonp和arts-clone目录拷贝到include/jieba中。 github上的limonp目录在另一个项目需要单独下载再组合。
>
> 使用示例：

<img src="https://img.gejiba.com/images/bb87a302e9bfb1a8c0e90aa5682c91fe.png" style="zoom:50%;" >

1. 先建立词频统计的结构体，再建立词和词频结构体的映射表。
2. 针对标题和内容分别分词，再分别对每个词进行词频统计，统计到映射表中。
3. 创建并填充一个倒排元素，再将倒排结构体添加到倒排拉链中。

```cpp
bool BuildInvertedIndex(const DocInfo& info)
{
    // 词频统计结构体
    struct word_cnt // 针对一个词的数据统计
    {
        int _title_cnt;
        int _content_cnt;

        word_cnt() : _title_cnt(0), _content_cnt(0)
        {}
    };
    std::unordered_map<std::string, word_cnt> word_map; // 暂存词与词频的映射表

    /* 根据文档标题和内容，分词并进行词频统计 */

    // 针对标题分词
    std::vector<std::string> title_words;
    Jieba::CutString(info._title, &title_words);
    // 遍历标题，进行词频统计
    for (std::string s : title_words) {
        boost::to_lower(s); // 统一转小写
        word_map[s]._title_cnt++; // 查找对应关键词，将标题次数++
    }

    // 针对内容分词
    std::vector<std::string> content_words;
    Jieba::CutString(info._content, &content_words);
    // 遍历内容，进行词频统计
    for (std::string s : content_words) {
        boost::to_lower(s);
        word_map[s]._content_cnt++;
    }

    /* 建立word和倒排拉链的映射 */
#define TITLE_PRI 10
#define CONTENT_PRI 1
    for (auto& word_pair : word_map)
    {
        InvertedElem item;
        // 构建元素
        item._doc_id = info._doc_id;
        item._word = word_pair.first;
        item._weight = TITLE_PRI * word_pair.second._title_cnt +
            CONTENT_PRI * word_pair.second._content_cnt; // 设置权重
        // 向拉链中添加元素
        _inverted_index[word_pair.first].push_back(item);
    }
    return true;
}
```

&nbsp;

## 7. 搜索引擎的模块

<img src="https://img.gejiba.com/images/91a5f2607079bef0986e64353ac333eb.png" style="zoom:50%;"  >

如图所示，搜索关键字也会被服务端分词，再进行索引查找，最后将所有结果返回给用户。

### 7.1 大致结构

```cpp
class Searcher
{
private:
    NS_Index::Index* index; // 供系统进行查找到索引
public:
    Searcher() {}
    ~Searcher() {}
    void InitSearcher(const std::string& input)
    {
        // 获取index对象
        _index = NS_Index::Index::GetInstance();
        // 建立索引
        _index->BuildIndex(input);
    }

    // @param query 用户输入的数据
    // @param json_string 返回给浏览器的结果
    void Search(const std::string& query, std::string* json_string);
    //...
};
```

### 7.2 搜索功能

参数很明确，用户数据的字符串和数据处理后返回的字符串。

1. 首先要对用户发来的字符串分词，分出多个关键词；
2. 遍历多个关键词进行查找，将所有关键词对应的倒排拉链放到一个拉链中，并完成去重和排序工作；
3. 遍历总倒排拉链，将其中对应文档信息的构建Json串，并返回。

```cpp
// @param query 用户输入的数据
// @param json_string 返回给浏览器的结果
void Search(const std::string& query, std::string* json_string)
{
    /* 对query分词 */
    std::vector<std::string> words;
    Jieba::CutString(query, &words);

    /* 对分出的多个关键词进行查找 */
    NS_Index::Index::InvertedList ivtd_list_v; // 保存所有关键字的所有倒排拉链

    for (auto word : words)
    {
        boost::to_lower(word);

        NS_Index::Index::InvertedList* ivtd_list = _index->GetInvertedList(word);
        if (ivtd_list == nullptr) {
            continue;
        }
        // 汇总到总倒排拉链中
        ivtd_list_v.insert(ivtd_list_v.end(), ivtd_list->begin(), ivtd_list->end());
    }

    /* 汇总所有查找结果，按照权重降序排序 */
    // 去重
    std::set<NS_Index::InvertedElem> unique_set(ivtd_list_v.begin(), ivtd_list_v.end());
    ivtd_list_v.assign(unique_set.begin(), unique_set.end()); // 导入去重后结果

    // 降序排序
    std::sort(ivtd_list_v.begin(), ivtd_list_v.end(),
              [](const NS_Index::InvertedElem& e1, const NS_Index::InvertedElem& e2) {
                  return e1._weight > e2._weight;
              });

    /* 将整体查找结果构建json序列化并返回 */
    // json对象
    Json::Value root;

    // 获取关键字对应文档信息
    for (auto& item : ivtd_list_v)
    {
        NS_Index::DocInfo* info = _index->GetDocInfo(item._doc_id);
        if (info == nullptr) {
            continue;
        }

        // 序列化
        Json::Value elem;
        elem["title"] = info->_title;
        elem["desc"] = GetDesc(info->_content, item._word);
        elem["url"] = info->_url;

        root.append(elem);
    }

    Json::StyledWriter writer;
    *json_string = writer.write(root); // 获取json串
}
```

#### 获取摘要

```cpp
std::string GetDesc(std::string& content, const std::string& word)
{
    // 找到首次出现位置
    size_t pos = content.find(word);
    if (pos == std::string::npos)
        return "NONE";

    // 确定开始和结束位置
    const size_t prev_step = 50; // 向前向后步长
    const size_t next_step = 50;

    size_t start = 0; // 起始结束默认值
    size_t end = content.size() - 1;

    // 从pos位置先前向后扩展step长度
    if (pos - prev_step >= 0)
        start = pos - prev_step;
    if (pos + next_step <= content.size())
     	end = pos + next_step;

    // 截取子串并返回
    return std::string(start, end - start + 1);
}
```

<img src="https://img.gejiba.com/images/c1a88cb30fd1e82dd3a356b7a4dc0918.png"/>&nbsp;

### 7.3 问题修复

#### 无符号数错误

使用无符号数进行存在负数的比较判断本身就是大忌。

上述获取摘要的向前向后扩展一个步长长度的过程中，使`pos-prev_step`和0进行比较，如果`pos`小于步长，`pos-prev_step`就是负数，无符号数就变成很大的正数条件自然成立，就会导致`start`大于`end`。

#### 查找方式错误

使用`find`查找，是区分大小写的，而且我们在获取查询字段`query`的时候就已经将`query`全部转为小写，这样是无法查询到大写情况的。

```cpp
// 忽略大小写查找，避免找不到的情况
auto iter = std::search(content.begin(), content.end(), word.begin(), word.end(),
                        [](char x, char y) {
                            return tolower(x) == tolower(y);
                        });
if (iter == content.end())
    return "NONE";

int pos = iter - content.begin(); // 转化查找位置
```

#### 读取query方式错误

如果单纯使用`cin`读取，会将query按空格拆成多个字段分别查找，不能一次返回。

```cpp
getline(std::cin, query);
```

#### 权重计算错误

我们前面解析文档内容的函数有一定的错误，直接读取文档内容没有越过标题部分。导致标题部分的关键词，在标题中统计一次，在内容处又被统计一次。并不影响使用。

#### 汇总重复结果



&nbsp;

## 8. http服务的模块

### 8.1 工具安装和使用

#### 升级gcc

我们项目的重点在于搜索功能的服务，所以网络服务就调用`cpp-httplib`完成。

https://gitee.com/welldonexing/cpp-httplib

使用 cpp-httplib 需要高版本的 gcc，单独安装gcc很麻烦，安装高版本的工具集可以`scl`安装。

```shell
$ yum -y install centos-release-scl  # 1. 安装scl的yum源
$ yum -y install devtoolset-8        # 2. 安装工具集
$ scl enable devtoolset-8 bash       # 3. 启动工具集
$ source /opt/rh/devtoolset-8/enable # 4. 加载工具集（出错执行）
```

https://blog.csdn.net/weixin_43364556/article/details/108315111

注意我们安装的是工具集，没有卸载原有的gcc，工具集的启动仅本次会话有效。若想启动自动生效可以添加到`~/.bashrc`中。

#### 安装测试cpp-httplib

> 如果cpp-httplib的版本太高，而gcc版本没有很新的话，还是会发生编译报错货运行出错的问题。

直接克隆仓库到本地，可以直接放到也可以创建软连接到项目目录下。

```shell
$ git clone https://gitee.com/welldonexing/cpp-httplib ~/depts/
$ ln -s ~/depts/cpp-httplib/ ~/Project/BoostSearch/cpp-httplib
```

##### 基本使用

```cpp
// 创建HTTP对象
httplib::Server svr;

// 设置web根目录
svr.set_base_dir(root_path);

// 注册GET方法
svr.Get("/hi", [](const httplib::Request& req, httplib::Response& rsp) {
    rsp.set_content("hello world，我是HTTP!", "text/plain: charset=utf-8");
});

// 设置监听
svr.listen("0.0.0.0", 8080);
```

### 8.2 http服务代码

```cpp
const std::string src_path = "data/output/raw.bin";
const std::string root_path = "./wwwroot";
int main()
{
    Searcher* searcher = new Searcher();
    searcher->InitSearcher(src_path);
    // 创建HTTP对象
    httplib::Server svr;
    // 设置web根目录
    svr.set_base_dir(root_path);
    // 注册GET方法
    svr.Get("/hi", [](const httplib::Request& req, httplib::Response& rsp) {
        rsp.set_content("hello world，我是HTTP!", "text/plain: charset=utf-8");
        });
    svr.Get("/s", [&searcher](const httplib::Request& req, httplib::Response& rsp)
        {
            if (!req.has_param("word")) // 是否有参数
                rsp.set_content("输入有误，请重新输入!", "text/plain: charset=utf-8");
            else
            {   // 提取参数
                std::string word = req.get_param_value("word");
                std::cout << "user query : " << word << std::endl;
                std::string json_string;
                // 进行搜索
                searcher->Search(word, &json_string);
                // 返回结果
                rsp.set_content(json_string, "applicaton/json");
            }
        });
    // 设置监听
    svr.listen("0.0.0.0", 8080);

    delete searcher;
    return 0;
}
```

&nbsp;

## 9. 编写前端模块

- html是超文本标记语言，由一个个标签构成网页的元素，属于网页的骨架。
- css是网页美化语言，可以对网页元素内容进行精确控制。
- javaScript可以对网页内容进行动态效果。

### 9.1 网页骨架

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <title>Boost 搜索引擎</title>
</head>
<body>
    <h1>欢迎使用Boost库搜索引擎</h1>
    <div class="container">
        <div class="search">
            <input type="text" value="请输入搜索内容">
            <button>搜索一下</button>
        </div>
        <div class="result">
            <div class="item">
                <a herf="#">这是标题</a>
                <p>这是摘要这是摘要这是摘要这是摘要这是摘要这是摘要这是摘要</p>
                <i>https://gitee.com/welldonexing/cpp-httplib</i>
            </div>
            <div class="item">
                <a herf="#">这是标题</a>
                <p>这是摘要这是摘要这是摘要这是摘要这是摘要这是摘要这是摘要</p>
                <i>https://gitee.com/welldonexing/cpp-httplib</i>
            </div>
            <div class="item">
                <a herf="#">这是标题</a>
                <p>这是摘要这是摘要这是摘要这是摘要这是摘要这是摘要这是摘要</p>
                <i>https://gitee.com/welldonexing/cpp-httplib</i>
            </div>
            <div class="item">
                <a herf="#">这是标题</a>
                <p>这是摘要这是摘要这是摘要这是摘要这是摘要这是摘要这是摘要</p>
                <i>https://gitee.com/welldonexing/cpp-httplib</i>
            </div>
        </div>
    </div>
</body>
</html>
```

### 9.2 网页美化

css设置样式的方式是：选择需要设置的标签，然后再制定该标签的样式。

```css
<style>
* {
    margin: 0;
    padding: 0;
}

html,
body {
    height: 100%;
}
.container {
    width: 800px;
    margin: 0px auto;
    margin-top: 15px;
}
.container .search {
    width: 100%;
    height: 52px;
}
.container .search input {
    /* 设置左浮动 */
    float: left;
    width: 600px;
    height: 50px;
    border: 1px solid black;
    /* border: 1px solid #4A4C4E; */
    border-right: none;
    padding-left: 10px;
    color: #9295A2;
    font-size: 15px;
}
.container .search button {
    float: left;
    width: 140px;
    height: 52px;
    background-color: #63855C;
    color: white;
    font-size: 17px;
    font-style: normal;
    font-family: "SF Pro SC", "SF Pro Display", "SF Pro Icons", "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.container .result {
    width: 100%;
    font-family: "SF Pro SC", "SF Pro Display", "SF Pro Icons", "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.container .result .item {
    margin-top: 15px;
}
.container .result .item a {
    text-decoration: none;
    font-size: 20px;
    color: #63855C;
}
.container .result .item a:hover {
    text-decoration: underline;
}
.container .result .item p {
    font-size: 15px;
    margin-top: 5px;
    color: #1d1d1f;
}
.container .result .item i {
    font-size: 13px;
    font-style: normal;
    color: #6e6e73;
}
</style>
```

### 9.3 前后端交互

使用原生的JS要求较高，我们采用JQuery框架。JQuery中可以使用ajax来进行前后端交互，如发起http请求。

```html
<script>
    function Search() {
    // alert("hello js!");
    // 1. 提取数据
    let query = $(".container .search input").val();
    console.log("query: " + query);
    // 2. 发起http请求
    $.ajax({
        type: "GET",
        url: "/s?word=" + query,
        success: function (data) {
            console.log(data);
            BuildHtml(data);
        }
    })
}
function BuildHtml(data) {
    // 获取result标签
    let tag_result = $(".container .result");
    // 清空历史结果
    tag_result.empty();

    for (let elem of data) {
        // console.log(elem.title);
        // console.log(elem.url);
        let tag_a = $("<a>", {
            text: elem.title,
            href: elem.url,
            target: "_blank"
        });
        let tag_p = $("<p>", {
            text: elem.desc
        });
        let tag_i = $("<i>", {
            text: elem.url
        });
        let tag_div = $("<div>", {
            class: "item"
        });

        tag_a.appendTo(tag_div);
        tag_p.appendTo(tag_div);
        tag_i.appendTo(tag_div);

        tag_div.appendTo(tag_result);
    }
}
</script>
```

<img src="https://img.gejiba.com/images/fb49a757d311fc7a4f255df1e50ad0a4.png" >
