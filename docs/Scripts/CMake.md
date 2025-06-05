# CMake

CMake是一个开源的、跨平台的项目构建工具。CMake构建项目的流程如下：

1. 编写CMakeLists.txt文件
2. cmake -B build（创建build目录，并在其下生成Makefile文件）
3. cmake --build build（编译构建项目）

.cmake文件是CMake的脚本文件，一般用来定义复杂逻辑，以供CMakeLists.txt内使用。

| cmake语法                                     | 解释                                                         |
| --------------------------------------------- | ------------------------------------------------------------ |
| **变量**                                      |                                                              |
| `set(变量名 "变量值")`                        | 定义单个变量                                                 |
| `set(变量名 "变量值1" "变量值2" ...)`         | 定义一个变量具有多个值                                       |
| `set(ENV{变量名} "变量值")`                   | 定义环境变量                                                 |
| `unset(变量名)`                               | 取消变量的定义                                               |
|                                               |                                                              |
| `list(APPEND 变量名 "变量值1" "变量值2" ...)` | 使用list定义或追加变量的值                                   |
| `list(INSERT 变量名 下标 "变量值")`           | 指定下标位置插入值                                           |
| `list(LENGTH 变量名 长度变量)`                | 获取变量的值个数，最后一个变量用于保存长度                   |
| `list(FIND 变量名 "值" 下标变量)`             | 查找值，并获取下标，下标变量用来保存下标                     |
| `list(REMOVE_ITEM 变量名 "值")`               | 删除值                                                       |
| `list(REVERSE 变量名)`                        | 翻转                                                         |
| `list(SORT 变量名)`                           | 排序                                                         |
| **条件判断**                                  |                                                              |
| `NOT AND OR LESS MORE EQUAL`                  | 与或非，大小等                                               |
| **流程控制**                                  |                                                              |
| `if(..) .. elseif(..) .. else() .. endif()`   | if语句                                                       |
| `foreach(..) .. endforeach()`                 | for循环                                                      |
| `foreach(变量名 RANGE num)`                   | 遍历取0到num的每个值                                         |
| `foreach(变量名 IN LISTS LIST变量)`           | 遍历取LIST变量中的每个值                                     |
| **函数**                                      |                                                              |
| `function(NAME [ARGS..]) .. endfunction()`    | 定义函数                                                     |
|                                               | 参数个数无所谓，可以通过参数名、\${ARGV}、\${ARGV0} \${ARGV1}.. 获得 |
|                                               | 参数传值调用，无法改变外部实参值                             |
| `macro(NAME [ARGS..]) .. endmacro()`          | 宏                                                           |

#### 模型一：根目录下CMakeLists写明源文件路径

```cmake
.
├── animal
│   ├── cat.cc
│   └── cat.h
├── CMakeLists.txt
└── main.cc

# CMakeLists.txt
project(animal)
set(animal_sources
    animal/cat.cc
    animal/dog.cc)
add_executable(animal main.cc ${animal_sources})
```

#### 模型二：根目录CMakeLists调用子目录下cmake脚本

```cmake
.
├── animal
│   ├── animal.cmake
│   ├── cat.cc
│   └── cat.h
├── CMakeLists.txt
└── main.cc

# animal.cmake
set(animal_sources animal/dog.cc animal/cat.cc) 
# CMakeLists.txt
project(animal)
include(animal/animal.cmake)
add_executable(animal main.cc ${animal_sources})
```

### 模型三：CMakeLists嵌套

| 函数                         | 解释           |
| ---------------------------- | -------------- |
| `target_include_directories` | 声明头文件目录 |
| `target_link_libraries`      | 声明库文件     |
| `add_subdirectory`           | 添加子目录编译 |
| `add_library`                | 添加生成库目标 |

```cmake
.
├── animal
│   ├── cat.cc
│   ├── cat.h
│   ├── CMakeLists.txt
│   ├── dog.cc
│   └── dog.h
├── CMakeLists.txt
└── main.cc # include"dog.h" "cat.h"

# animal/CMakeLists.txt
add_library(animal cat.cc dog.cc)
# CMakeLists.txt
project(animal)
add_subdirectory(animal)
add_executable(animal_test main.cc)
target_link_libraries(animal_test PUBLIC animal)
target_include_directories(animal_test PUBLIC ${PROJECT_SOURCE_DIR}/animal)
```

