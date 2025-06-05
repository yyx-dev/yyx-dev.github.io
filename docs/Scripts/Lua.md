# Lua

## 1. 数据类型

| 类型       | 解释                                                         |
| ---------- | ------------------------------------------------------------ |
| `nil`      | nil表示无效值，在条件判断中表示false                         |
| `boolean`  | 布尔值                                                       |
| `number`   | 表示整数或浮点数                                             |
| `string`   | 用单引号或双引号引起来的字符串，没有字符只有字符串，`[[]]`表示原始串 |
| `table`    | 元组，元素可以是各种类型的数组                               |
| `function` | 函数                                                         |
| `thread`   | 协程                                                         |
| `userdata` | 用户自定义数据                                               |

## 2. 变量

Lua是弱类型语言，变量无需声明类型即可直接使用，变量的类型可以随赋值的内容随时改变。

变量分为全局变量和局部变量。默认是全局变量，全局变量可声明在任意位置，后续任何地方都可使用。局部变量需要加local标识。

## 3. 运算符

| 运算符       | 解释                             |
| ------------ | -------------------------------- |
| + - * %      | 和C语法含义一致                  |
| /            | 浮点数除法，整数相除可以为浮点数 |
| //           | 整数除法，相除结果为整数         |
| ^            | 乘幂，1^10表示1的10次方          |
| > < >= <= == | 和C语法含义一致                  |
| ~=           | 不等于，相当于C语法的 !=         |
| and or not   | 与或非                           |
| ..           | 字符串连接符                     |
| #            | 取字符串或表的长度               |

## 4. 函数

Lua中的函数定义以function开头，后面跟函数名和参数列表，以end结尾。可以有多个返回值，也可以无返回值。

### 传参规则

传参时，如果实参个数过多，多余的参数会被抛弃，如果个数过少，剩余的形参为nil。

```lua
function func1(a, b)
    print(a, b)
end

func1()        -- nil     nil
func1(1)       -- 1       nil
func1(1, 2)    -- 1       2
func1(1, 2, 3) -- 1       2

function func2(...)
    local a, b, c, d = ...
    print(a, b, c, d)
end

func2(1)             -- 1       nil     nil     nil
func2(1, 2)          -- 1       2       nil     nil
func2(1, 2, 3)       -- 1       2       3       nil
func2(1, 2, 3, 4)    -- 1       2       3       4
func2(1, 2, 3, 4, 5) -- 1       2       3       4
```

### 多返回值

```lua
function func3(a, b)
    local sum = a + b
    local mul = a * b
    return sum, mul
end

local m, n = func3(1, 2)
print(m, n)
```

### 函数作参数

```lua
function sum(a, b)
    return a + b
end
function mul(a, b)
    return a * b
end
function func4(x, y, func)
    local res = func(x, y)
    print(res)
end

func4(1, 2, sum)
func4(1, 2, mul)

func4(3, 5, function(a, b) -- 匿名函数
    return a ^ b
end)
```

## 5. 流程控制

### 分支

```lua
if (a < 3) then
    print("< 3")
elseif a < 5 then
    print("< 5")
else
    print("> 5")
end
```

### 循环

| 循环           | 解释                                                         |
| -------------- | ------------------------------------------------------------ |
| while...end    | 和C语法的while循环类似                                       |
| repeat...until | 循环直到条件为真，until条件为真时结束循环                    |
| for...end      | 将C语法的for循环简写，三个部分分别为循环因子、结束条件、步长，但结束条件是<= |

```lua
a = 5

while a > 0 do
    print(a) -- 5 4 3 2 1
    a = a - 1
end

repeat
    print(a) -- 5 4 3 2 1
    a = a - 1
until a <= 0

for i = 1, 5, 2 do
    print(i) -- 1 3 5
end

for i = 1, 5 do -- 步长省略为1
    print(i) -- 1 2 3 4 5
end
```

### goto

Lua的goto和C的作用一样，但细节稍有不同。跳转标记位用`::`包裹，后面可以跟语句执行。

```lua
function func(a) 
	::flag:: print("flag here")
    if (a > 0) then
		a = a - 1
        goto flag
    end
end
```

## 6. 表

### 用法

#### 数组

table可以当作数组使用，下标访问也只对table其中的数组元素有效。越界访问值为nil。

```lua
local cities = {
    '北京',
    '上海',
    '广州',
}
cities[4] = '深圳'

print(cities[5]) -- nil
```

```lua
local arr = {}

for i = 1, 3, 1 do
    arr[i] = {}
    for j = 1, 3, 1 do
        arr[i][j] = i * j
    end
end

for i = 1, 3 do
    for j = 1, 3 do
        io.write("arr["..i.."]["..j.."]="..arr[i][j].." ")
    end
    print()
end
```

#### 字典

table可以作哈希存储键值对，支持`[key]`的方式访问，也支持`.key`的方式访问。

```lua
local emp = {
    name="张三",
    age="23",
    dept="开发"
}

emp["gender"]="男"
emp.level=2

print("name:  ".. emp.name)
print("gender:".. emp.gender)
print("age:   ".. emp.age)
print("dept:  ".. emp.dept)
print("level: ".. emp.level)
```

#### 混合

table中允许元素和键值对混合存在，此时下标访问仅对数组元素有效，忽略table中的键值对。

```lua
local tb = {
    '北京',
    name="张三",
    age="23",
    '上海',
    dept="开发",
    '广州',
}
print(tb.name, tb.age, tb.dept)
print(tb[1], tb[2], tb[3])
```

```lua
local emps = {
    { name="zs", age=18 },
    { name="ls", age=18 },
    { name="ww", age=18 },
}

for i = 1, 3, 1 do
    print(emps[i].name..', '.. emps[i].age)
end
```

### 接口

#### concat

仅对table中的数组元素进行连接，可以指定始末下标以及间隔符。

```lua
str = table.concat(tb, ', ', 1, 3)
```

#### unpack

拆包，意思是仅对table中的数组元素进行获取，可以指定始末下标，以多个返回值的形式返回。

```lua
i, j, k = table.unpack(tb, 1, 3)
```

#### pack

打包，意思是将参数列表中的多个参数打包成一个table，并返回。

```lua
tb = table.pack(i, j, k)
```

#### insert / remove

insert指定下标位置的插入，不指定下标默认尾部插入。remove删除下标位置的数据，默认尾部删除。

#### sort

对table的数组内容进行排序，可以指定比较方法。要求所有数组元素类型一致。	

```lua
table.sort(city)
table.sort(city, function(a, b)
    return a > b
end)
```

### 迭代器

迭代器ipairs和pairs，分别用于遍历table中的数组元素和所有元素，搭配泛型for使用。

```lua
for idx, val in ipairs(tb2) do
    print(idx, val)
end

for key, val in pairs(tb2) do
    print(key, val)
end
```

## 7. 模块

我们可以将一些变量和函数封装到一个table中，然后将其单独放在一个文件里，这就是一个模块。

外部想要调用该模块内部的东西时，可以require该文件，然后访问该table里的变量和函数。

```lua
local rectangle = {}

rectangle.pi = 3.14
function rectangle.perimeter(a, b)
    return (a + b) * 2
end
rectangle.area = function (a, b)
    return a * b;
end

return rectangle
```

```lua
local mod = require("rectanglefile")
print(mod.pi)
print(mod.perimeter(1, 2))
print(mod.area(1, 2))
```

## 8. 元表和元方法

为表设置一个元表，修改元表提供的一些元方法，就可以达到对table的操作符进行重载的效果。

```lua
setmetatable(t1, meta)
setmetatable(t2, meta)
```

| 元方法       | 解释                                                         |
| ------------ | ------------------------------------------------------------ |
| `__index`    | 定义以`.key`的形式获取值的行为，`tb.key`                     |
| `__newindex` | 定义以`.key`的行为添加键值对，当表中不存在该key时的行为，`tb.key=val` |
| `__add`      | 定义两个表相加时的行为，`tb1+tb2`                            |
| `__sub`      | 定义两个表相减时的行为，`tb1-tb2`                            |
| `__eq`       | 定义两个表判断相等时的行为，`tb1==tb2`                       |
| `__tostring` | 定义表转string类型时的行为，`tostring(tb)`                   |
| `__call`     | 定义以`()`的方式，类似函数调用table的行为，`tb()`            |

```lua
meta.__index = function(tb, key)
    return rawget(tb, key)
end

mtb3.__newindex = function (tb, k, v)
    rawset(tb, k, v)
end

print(emp.name) -- index
emp[key]=val    -- newindex
```

```lua
meta.__add = function(t1, t2)
    local res = {}
    for i = 1, #t1 do
        res[i] = t1[i]
    end
    for i = 1, #t2 do
        res[i + #t1] = t2[i]
    end
    return res
end

print(table.concat(t1 + t2, ', '))
```

```lua
meta.__sub = function(t1, t2)
    return {}
end

print(table.concat(t1 - t2, ', '))
```

```lua
meta.__eq = function(t1, t2)
    if #t1 ~= #t2 then
        return false
    end
    for i = 1, #t1 do
        if t1[i] ~= t2[i] then
            return false
        end
    end
    return true
end
print(t1 == t2)
```

```lua
meta.__tostring = function(t)
    res = ''
    for k, v in pairs(t) do
        res = res .. k .. ':' .. v .. ', '
    end
    return res
end

print(t)
```

```lua
mtb3.__call = function(t, ...)
    for _, v in pairs({...}) do
        return t[v]
    end
	return t[1]
end

print(t())
print(t(1))
print(t(1, 2))
```

##  9. 面向对象

### 创建对象

Lua中没有类的概念，但是可以使用table中放入属性和函数来模拟类。

如果想让函数获取table本身，可以将`.`换成`:`，在函数内部就可以用`self`访问table内的属性。

```lua
local animal = {
    name = "animal",
    age = 18,
    bark = function(self)
        print(self.name .. " is bark")
    end,
}
function animal.bark(self)
    print(self.name .. " is bark")
end
function animal:bark()
    print(self.name .. " is bark")
end

animal.bark(animal)
animal:bark()
```

### 类的定义和继承

只需为table添加一个构造器new函数，在其中绑定一个空表作元表并设置__index为基表。

返回该空表，该空表就是一个新的对象。

如果为该空表添加新的键值对，那么它就是子类。可以为构造器设置一个table类型的参数，将其中属性添加到元表中。

```lua
local Person = {
    name = nil,
    age = nil,
}
function Person.sleep()
    print("sleep now")
end
function Person.work()
    print("work now")
end

function Person:new(obj)
    local meta = {}
    if (type(obj) == "table") then
    	meta = obj
    end
    return setmetatable(meta, { __index = self }) -- 在meta表中找不到的键值对，则会到Person表中找
end

local p1 = Person:new()  -- 创建对象
local p2 = Person:new({type="wkr"}) -- 创建子类对象

print(p1, p2)
```

## 10. 协程

Lua中，任意时刻只允许一个协程运行。

| 接口                     | 解释                                                     |
| ------------------------ | -------------------------------------------------------- |
| `coroutine.create(func)` | 创建协程并指定回调函数                                   |
| `coroutine.wrap(func)`   | 创建协程，调用该函数返回的函数即可启动线程               |
| `coroutine.resume(th)`   | 启动协程，返回值为协程是否启动成功，以及协程函数的返回值 |
| `coroutine.running()`    | 返回正在运行的协程对象                                   |
| `coroutine.yield(th)`    | 挂起指定协程                                             |
| `coroutine.status(th)`   | 查看协程的状态，运行态、挂起态、消亡态                   |

## 11. 文件

Lua的文件操作，分别以静态函数和实例函数的方式提供，`io`开头的静态函数和`file`开头的

| 接口                                 | 解释                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `io.open(name, mode)`                | 以指定模式打开指定文件，返回文件对象                         |
| `io.close(file)` / `file:close()`    | 关闭文件                                                     |
| `io.input(file)` / `io.output(file)` | 将程序标准输入输出重定向到指定的文件                         |
| `io.read(fmt)` / `file.read()`       | 按格式读取数据，`*n`读取数字，`*a`读取全部，`*l`读取一行，数字读取指定个字符 |
| `io.write(str)` / `file.write()`     | 写入数据                                                     |
| `file.seek()`                        | 和C语言类似                                                  |

## 12. MySQL

```bash
sudo apt install luarocks -y
sudo luarocks install luasocket # sudo apt install luarocks -y
sudo luarocks install luasql-mysql # sudo apt install lua-sql-mysql
```

```lua
local luasql = require("luasql.mysql")

local cli = luasql.mysql()
if cli == nil then
    print("mysql failed")
    os.exit()
end

local conn = cli:connect("cloud", "yyx", "YYXyyx123456", "127.0.0.1", 3306)
if conn == nil then
    print("conn failed")
    os.exit()
end

local res = conn:execute("select * from backup_info;")
if res == nil then
    print("execute failed")
    os.exit()
end

while true do
    local row = res:fetch({}, 'a')
    if row == nil then
        break
    end
    for k, v in pairs(row) do
        io.write(k .. ": " .. v.."  ")
    end
    print()
end
```

## 13. Redis

[redis-lua](https://github.com/nrk/redis-lua/blob/version-2.0/src/redis.lua)

```lua
local redis = require('redis')
if redis == nil then
    print("redis error")
    os.exit()
end

local client =redis.connect('127.0.0.1', 6379)
if client == nil then
    print("conn error")
    os.exit()
end

local rsp = client:ping()
if not rsp then
    print("ping failed")
    os.exit()
end

print(client.get('key'))
```

## 14. C API

Lua通过虚拟栈和C程序交互，想要在C程序中获取Lua的内容都要从栈上取。

| 接口                                      | 解释                                                         |
| ----------------------------------------- | ------------------------------------------------------------ |
| **启动lua**                               |                                                              |
| `luaL_newstate()`                         | 创建lua状态机                                                |
| `lua_close()`                             | 关闭lua                                                      |
| `luaL_openlibs(state)`                    | 打开lua的一些库                                              |
| **执行/加载脚本**                         |                                                              |
| `luaL_dostring(state, script)`            | 执行lua脚本                                                  |
| `luaL_loadfile(state, luafilename)`       | 加载lua文件编译成函数并压入栈，可通过pcall调用，无参无返回值 |
| **get/set全局变量**                       |                                                              |
| `lua_getglobal(state, varname)`           | 将lua中指定的全局变量压入栈                                  |
| `lua_setglobal(state, varname)`           | 将栈顶元素设置为全局变量                                     |
| **判断/获取/压入栈**                      |                                                              |
| `lua_is*(state)`                          | 判断栈顶的元素是否为某种类型                                 |
| `lua_to*(state, int)`                     | 获取栈中指定位置的元素，正下标表示从栈底，负下标表示从栈顶   |
| `lua_push*(state, type)`                  | 将指定类型的变量压入栈                                       |
| `lua_pop(state, n)`                       | 弹出指定个数的栈顶元素                                       |
| **调用/注册函数**                         |                                                              |
| `lua_pcall(state, argsn, resn, errfunc)`  | 调用lua函数，需要先将函数和实参都压入栈，返回值为0表示正常   |
| `lua_register(state, const char*, cfunc)` | 将C函数注册到lua中以供其调用                                 |
| **创建C对象**                             |                                                              |
| `lua_newuserdata(state, size)`            | lua开辟一个c对象并将其压入栈，可由lua获取并使用，内存交给lua管理 |
| **get/set表**                             |                                                              |
| `lua_gettable(state, idx)`                | 传入table的栈位置，该函数会先获取栈顶字符串作key，然后将对应val压栈 |
| `lua_getfield(state, idx, key)`           | 传入table的栈位置，通过key获取val并压栈                      |
| `lua_setfield(state, idx, key)`           | 传入table的栈位置，已知key，获取栈顶元素作val，一并插入table中 |
| `lua_settable(state, idx)`                | 传入table的栈位置，将栈顶两个元素作键值对，插入table中       |
| **元表**                                  |                                                              |
| `luaL_newmetatable(state, name)`          | 创建一个指定名称的元表                                       |
| `luaL_getmetatable(state, name)`          | 获取指定名称的元表                                           |
| `lua_setmetatable(state, idx)`            | 传入table的栈位置，为其绑定元表                              |
