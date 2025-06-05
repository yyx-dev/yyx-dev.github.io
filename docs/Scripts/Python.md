# Python基础语法

## 1. 常量和变量

### 1.1 常量

```python
print(1 + 2 / 3)
// 1.6666666666665
```

在Python中省去类型造成的麻烦，没有整数除法一说，全部是更贴合数学的浮点数除法。

形如`1+2-3`这样的表达式就是表达式，表达式的运算结果就称为表达式的返回值。

```python
avg = (67.5 + 89.0 + 12.9 + 32.2) / 4
total = (67.5 - avg) ** 2 + (89.0 - avg) ** 2 + (12.9 - avg) ** 2 + (32.2 - avg) ** 2
result = total / 3
```

变量可以视为一块用来存放数据的盒子。

### 1.2 变量的操作

#### 定义变量

```cpp
a = 10
```

等号表示赋值。不是数学意义的相等。

#### 变量名规则和规范

- 由数字、字母、下划线组成，不可以数字开头。
- 严格区分大小写
- 不能使用已有关键字作标识符

> 一些具有特殊功能的标识符，这就是所谓的关键字。已被python官方使用，所以不允许开发者自己定义和关键字相同名字的标识符。
>
> ```python
> False  None  True  and  as  assert  break  class  continue  def  del  elif 
> else  except  finally  for  from  global  if  import  in  is  lambda  nonlocal 
> not  or  pass  raise  return  try  while  with  yield
> ```

定义变量须遵守一定的命名规范：

- 大驼峰命名法：第一个单词的首字母小写，之后的单词首字母大写；
- 小驼峰命名法：每个单词的首字母都大写；
- C语言式命名法：单词全小写，以下划线分隔；

#### 使用变量

```python
a = 1 # 创建变量，初始化
a = 2 # 使用变量，重新赋值
```

### 1.3 数据类型

在 Python 中数据都有各自的类型：

- 数字：有`int`整数类型，`float`浮点类型，`complex`复数类型
- 布尔类型：True 和 False
- 字符串类型：`String`
- 列表：`List`
- 元组：`Tuple`
- 字典：`Dictionary`

```python
b = 34
print(b)

a = '你好，世界'
print(a)
print('hello woRld')
print('45')
a = False
print(a)
print(4 > 3)
print(4 < 3)


# 数组类型
names = ['姚万万', '邹碧惠', '郑美水', '蔡成功']

# 字典类型
person = { 'name': '赵处长', 'age': 36, 'addr': '湖北', '身高': '180' }

# 元组类型
nums = { 1,8,7,4,9,2,0 }

# 集合类型
x = { 8, '8', 3.3 }
```

`type()`可以查看变量的类型：

```python
type(a)
print(type(a))
```

#### int

不像Java和C++中`int`类型只能表示正负`21`亿大小，Python 中整数所能表示的数据范围是“无穷”的，可以自动扩容。所以 Python 中没有其他整型只有`int`。

#### float

Python 中浮点数只有一个`float`类型。

#### str

Python 认为使用`'`或者`"`引起来的都是字符串。即不区分字符和字符串。

```python
e = "My name is \"yyx\""
e = 'My name is "yyx"'
e = "My name is 'yyx'"
```

如果字符串中存在一种引号，我们就可以使用另一种引号将字符串引起来。

```python
e = '''My 'name' is "yyx"'''
e = """My "name" is 'yyx'"""
```

```python
a1 = "hello"
a2 = 'world'
print(a1 + " " + a2) # hello world
```

这样的代码就是字符串拼接。

此外，我们不能将不同类型的数据变量拼接到一起。

#### bool

Python 使用布尔类型来表示真假，即`True`和`False`。

#### 类型的意义

> 为什么要有这么多类型？

1. 类型决定了数据在内存中占据多大空间；
2. 类型其实约定了能对这个变量做什么样的操作。

> 例如`int/float`类型的变量，可以进行`+-*/`等操作。

类型系统其实是在对变量进行“归类”相同类型的变量，往往具有类似的特性和使用规则。

### 1.4 动态类型特性

Python是弱类型语言，其中的**变量是没有数据类型的**。我们所说的变量的数据类型，其实是变量存储的值的数据类型。

弱类型语言的变量，运行中存储数据的类型是可以发生变化的，反之强类型语言是不可以的。

> 比如一个变量可以先赋值成字符串，再赋值成整数都可以。

```python
a: int = 1
print(a)

a: str = 'hello'
print(a)
```

可以为变量添加变量声明，但也仅起到提示作用。

&nbsp;

## 2. 输入输出

输入输出设备最基本的方式就是控制台交互。

### 2.1 输出

```python
print('hello', 'good', 'yes', 'hi')
print('hello', 'good', 'yes', 'hi', sep='+')
print('hello', 'good', 'yes', 'hi', sep='+', end='---------')

a = 1
print(f"a = {a}") # a = 1
```

### 2.2 输入

`input`就是python中的输入用的内建函数，`()`内是提示内容，可以直接赋值给变量。

```python
name = input("请输入：")
print(name)
a = int(a)
```

`input`返回的值是一个字符串。如果要把读到的结果当作整数进行算术运算，可以使用类型转换`int()`。

如果要把其他类型转换成字符串，也可以使用`str()`。

&nbsp;

## 3. 运算符

### 3.1 算术运算符

| 运算符      | 解释                               |
| ----------- | ---------------------------------- |
| `+ - * / %` | 加减乘除取模                       |
| `**`        | 乘方运算，支持乘方也支持开方       |
| `//`        | 整数除法，向下取整，负数就往更负取 |

默认顺序：先算乘方，再算乘除，再算加减。

Python 的除法没有截断问题，整数除以整数可以得到浮点数。

### 3.2 关系运算符

| 运算符          | 解释             |
| --------------- | ---------------- |
| `< <= >= == !=` | 和C/C++/Java一致 |

返回值都是布尔类型。

关系运算符可以运算字符串类型，大小比较和 C/C++ 一样都是按照字典序比较。

对于浮点数来说，使用`==`去比较相等，存在风险。因为浮点数在内存中的存储和表示存在误差。

```python
print(0.1 + 0.2) # 0.30000000000000004
```

> 如果正确的进行浮点数比较呢？

应该对两者进行作差，判断结果是否在合理的范围内即可。

```python
a = 0.1 + 0.2
b = 0.3
print(-0.00001 < (a - b) < 0.00001) # python支持连续判断
```

### 3.3 逻辑运算符

| 运算符 | 解释     |
| ------ | -------- |
| `and`  | 并且     |
| `or`   | 或者     |
| `not`  | 逻辑取反 |

和其他语言的逻辑运算含义一致。只要是逻辑运算都存在短路求值的细节。

### 3.4 赋值运算符

`=`表示赋值，也就是将等式右侧的表达式的值填充到左侧的空间中。

```python
10 = 20 # ERR
10 == 20
a = b = 1 # 链式赋值 不推荐
```

```python
a, b = 10, 20 # 多元赋值 不推荐
a, b = b, a   # 多元赋值 实现两数交换
```

此外多元赋值可以实现函数返回多个值。

python 中还有`+= -= *= /=`复合赋值符。使用时应保证变量已被定义。

python不支持`++ --`自增自减操作符。前置`++/--`都会被解释成取正取负，后置`++/--`无法解释直接报错。

> 除此之外，python还有其他的一些操作符，我们用到再了解。

&nbsp;

## 4. 条件循环语句

默认情况下，Python 代码的执行顺序，是从上到下依次执行的。

条件语句也叫做分支语句，表示接下来的逻辑可能有几种走向。就是根据一个具体条件的成立与否，来决定接下来的逻辑走向。

### 4.1 条件语句

1. `if`后面的条件表达式不需要使用`()`，而是使用`:`作为结尾。
2. `if/else`条件后没有代码块`{}`，而是使用缩进标识。
3. 其他语言中的`else if`被缩写成了`elif`。

#### 单个if

```python
if expression:
    do_thing1
    do_thing2
next_thing
```

- `expression`条件为真执行`do_thing1`和`do_thing2`，反之则不执行。
- `next_thing`不受条件影响。

#### if else

```python
if expression:
    do_thing1
else:
	do_thing2
next_thing
```

- `expression`条件为真执行`do_thing1`，为假则执行`do_thing2`。
- `next_thing`不受条件影响。

#### if elif else

```python
if expression1:
    do_thing1
elif expression2:
    do_thing2
else:
    do_thing3
next_thing
```

- `expression1`条件为真，执行`do_thing1`；
- `expression1`为假并且`expression2`为真，执行`do_thing2`；
- `expression1`为假并且`expression2`为假，执行`do_thing3`；
- `next_thing`不受条件影响。

```python
# 嵌套条件语句
if True:
    if False:
        print('False')
    print('True')
```

Python中的缩进很重要。切不可胡乱缩进，各种语句的代码块全靠缩进识别。

### 4.2 循环语句

#### while

基本语法格式：

```python
while expression:
    stat_ment
```

#### for

```python
for 循环变量 in 可迭代对象:
    循环体
```

可迭代对象是一种特殊的变量，内部包含了很多的值。

把可迭代对象中的每一个值，都取到循环变量中，再去执行循环体。

```python
for i in range(1, 11):     # 一段整数
    print(i)
for i in range(1, 11, 2):  # 第三个参数为步长
	print(i)
    
# 逆序打印
for i in range(10, 0, -1):
    print(i)
```

`range`是一个内建函数，作用是得到一个“可迭代对象”，这个可迭代对象中包含了参数范围的一段整数。

**该范围区间是左闭右开的**。

#### continue&break

| 关键字     | 作用                                 |
| ---------- | ------------------------------------ |
| `continue` | 立即结束当前次循环，并进入下一次循环 |
| `break`    | 立即结束当前循环                     |

```python
for i in range(1, 6):
    if i == 3:
        print(f'发现有虫子，扔掉第{i}个包子')
        continue
    print(f'吃第{i}个包子')

for i in range(1, 6):
    if i == 3:
        print(f'发现有半只虫子，不想吃了')
        break
    print(f'吃第{i}个包子')
```

### 4.3 空语句

Python对于语法格式尤其是缩进的要求较为严格，所以代码块中啥也不写是不符合要求的，此时可以使用一个空语句`pass`代替。

```python
if a != 1:
    pass
else:
    print('else')
```

&nbsp;

## 5. 函数

> 函数可以简单的理解成一段可以重复使用的代码。

### 5.1 基本语法

```python
# 定义函数
def func_name(parm1, parm2, ...):
	stat_ment
    return ...;

# 调用函数
ret = get_sum(1, 2)
```

| 元素          | 含义             |
| ------------- | ---------------- |
| `def`         | 表示定义函数     |
| `func_name`   | 函数名           |
| `(parm, ...)` | 形参列表         |
| `stat_ment`   | 函数体，注意缩进 |

Python 中规定函数定义一定要放到函数调用之前。

> 关于形参，实参的概念不再赘述。

Python 中的函数可以一次返回多个值，这是非常好的特性。

```python
def test():
    return 1, 2


ret = test()
a, b = test()
_, b = test() # 下划线占位忽略该位置的返回值
a, _ = test()
```

### 5.2 变量作用域

```python
def getPoint():
    x = 10
    y = 20
    return x, y

x, y = getPoint()
print(x, y)
```

函数里外两个同名变量互不冲突，变量具有作用域属性，具体不再赘述。

```python
x = 10

def test():
    global x    # 声明x为全局变量
    x = 20
    print(f'x={x}')


test()
print(x)
```

**`global x`意为声明`x`为全局变量**，否则对`x=20`的赋值语句会被解释为创建局部变量`x`并初始化。

```python
# for
for i in range(1, 21):
    print(i)

print('-----------------------')
print(i)

# if
if True:
    x = 1

print(x)

# while
a = 1
while True:
    a = 2
    break

print(a)
```

**Python 中只有函数体和类体会产生作用域**，除此之外，如`if`、`while`、`for`等语句的代码块都不会影响变量的作用域。

### 5.3 形参默认值

函数定义的时候可以给形参设置默认值，和C++中的形参默认值用法一致，不再赘述。

```python
def add(x, y, debug=False):
    if debug:
        print(f'x = {x}, y = {y}')
    return x + y


ret = add(10, 20, True)
ret = add(10, 20)
print(ret)
```

### 5.4 关键字参数

函数传参一般按形参的顺序一次传递参数的，但我们也可以通过关键字参数，指定参数传递的位置。同时也能起到提醒传参位置的作用。

```python
def get(x, y):
    print(x , y)


get(x=10, y=20)
get(y=10, x=20)
```

关键字参数，一般搭配默认参数使用的。

&nbsp;

## 6. 列表和元组

### 6.1 列表和元组的概念

我们经常创建变量存储数据，如果个数较少直接定义几个变量即可。如果个数较多或者个数不确定，就可以使用列表。

Python中的列表和元组就是这样的机制，类似于C++中的数组。

列表和元组大部分的功能都差不多，唯一区别是列表元素个数可变类似`vector`，元组元不可变`array`。

### 6.2 创建列表

创建列表有两种方式：

- 直接使用字面值创建

```python
a = [1, 2, 3, 4]
```

- 使用`list()`创建

```python
a = list()
```

### 6.3 下标访问

列表可以存储不同类型的值。

```python
a = [1, 'hello', True, [2, 3]]
```

我们通过下标访问操作符`[]`获取列表中元素。使用方法和C/C++一致。

```cpp
print(a[0])
print(a[1])
print(a[3][0])
    
a[0] = 1
a[1] = 2
```

可以使用内建函数`len`获取列表长度。

```python
print(len(a)) # 4
```

访问下标可以写成负值，实际效果相当于列表成环状，负值是倒着访问。

### 6.4 切片访问

切片操作就是一次性访问一部分列表元素，**使用`[begin:end]`的方式提供一个左闭右开的区间**范围。

```python
a = [1, 2, 3, 4]
print(a[0:1]) # [1]
print(a[1:3]) # [2, 3]
```

同时`[begin:end]`的左右边界也是可以省略的。

省略左边界，就是从`0`下标开始；省略右边界，就是到最后一个位置结束。

```python
print(a[0:])  # [1, 2, 3, 4]
print(a[:4])  # [1, 2, 3, 4]
print(a[:])   # [1, 2, 3, 4]
```

> 当然这里的下标也可以写成负值。

列表的切片访问是比较高效的操作，只是取出了列表中的一部分，并不涉及拷贝数据。

切片访问还可以指定“步长”，类似于内建函数`range`。方式是`[beign:end:step]`在加一个`:`设置步长即可。

```python
a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
print(a[::1])  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
print(a[::2])  # [0, 2, 4, 6, 8]
print(a[::3])  # [0, 3, 6, 9]
```

步长设置为负值，表示从后向前访问元素。

### 6.5 遍历访问

```python
a = [1, 2, 3, 4]
for elem in a:
    print(elem)

for i in range(0, len(a)):
    print(a[i])

i = 0
while i < len(a):
    print(a[i])
    i += 1
```

第一种会产生拷贝，故因此也无法修改原值。

### 6.6 增删查改

#### 插入元素

- `append`方法向列表末尾追加一个元素。
- `insert`方法向指定下标位置插入一个元素。

```python
a = [1, 2, 3, 4]
a.append('hello')
print(a)

a = [1, 2, 3, 4]
a.insert(1, 'hello')
print(a)
```

#### 查找元素

- `in`或者`not in`操作符判定元素是否在列表中存在。返回值是布尔类型。
- `index`方法获取元素在列表中的位置下标。有则返回下标，无则抛出异常。

```python
print(1 in a)
print(10 in a)
print(1 not in a)
print(10 not in a)

print(a.index(1))
print(a.index(2))
```

#### 删除元素

- `pop`方法删除列表中最末尾的元素，或者**指定下标位置的元素**。
- `remove`方法删除列表中**指定值的元素**，

```python
a = [1, 2, 3, 4]
a.pop()
a.pop(1)
print(a)

a.remove(1)
print(a)
```

### 6.7 拼接列表

- 使用`+`针对两个列表进行拼接，类似于字符串拼接。结果是生成新列表，不会修改原列表。

```python
a = [1, 3, 5, 7] # [1, 3, 5, 7, 2, 4, 6, 8]
b = [2, 4, 6, 8] # [1, 3, 5, 7, 2, 4, 6, 8]
c = a + b
print(c)
print(a + b)
```

- `extend`方法将参数列表拼接到一个列表的后面。当然，`+=`也可以达到同样的效果。

```python
a.extend(b)
print(a)  # [1, 3, 5, 7, 2, 4, 6, 8]
print(B)  # [2, 4, 6, 8]

a += b
print(a)
```

### 6.7 关于元组

元组在功能上和列表基本一致。元组使用`()`表示。

元组创建时可以赋初始值，元组中的元素也可以是任意类型的。

```python
a = ()
a = tuple()

a = (1, 2, 3, 4, 5)
print(a)
a = (1, 2, 'hello', True, [], ())
print(a)
```

**元组不能修改里面的元素，但列表可以。**

所以，元组支持读取操作，如下标访、切片访问、遍历操作、`in/not in`操作符、`index`方法等。但是如增删改操作是不支持的。

> 元组不支持修改，则可视为不可修改对象，可以理解为C语言中的`const`类型变量。

&nbsp;

## 7. 字典

### 7.1 字典的概念

Python 中的字典，是存放键值对元素的一种结构，键值重复的键值对会被覆盖。字典的低层结构是哈希表。

### 7.2 创建字典

```python
# 空字典
a = {} 
b = dict()

a = {'id': 1, 'name': '张三'}
b = {
    'id': 1,
    'name': '张三'
}
```

### 7.3 查找元素

- 使用`in/not in`可以判定key是否再字典中存在。

```python
student = {
    'id': 1,
    'name': 'zhangsan'
    6666: 'test'
}

print('id'    in student) # True
print('score' in student) # False
```

- 使用`[]`根据key获取对应的value。

```python
print(student['id'])
print(student[6666])
```

### 7.4 新增/修改/删除

- 我们使用`[]`在字典中新增和修改元素，是新增还是修改取决于`key`是否存在。
- 使用`pop()`函数传入`key`来删除对应元素。

```python
student = {
    'id': 1,
    'name': 'zhangsan',
    100: '100'
}

# 插入操作
student['score'] = 99
# 修改操作
student['score'] = 88

# 删除操作
student.pop('id')
student.pop(100)
```

### 7.6 遍历字典

字典的底层是哈希表，进行增删查改操作的时间复杂度都是 $O(1)$。但遍历的效率就要底下一些。

```python
for key in student:
    print(student[key])
```

- `keys()`函数返回所有key的集合；
- `values()`函数返回所有value的集合；
- `items()`函数返回所有键值对的集合。

```python
print(student.keys())
print(student.values())
print(student.values())
```

> 返回的是自定义类型，但我们可以当成列表使用。

哈希中元素的存储顺序是无序的，但Python对其做了特殊处理，保证遍历顺序和插入顺序一致。

&nbsp;

## 8. 文件操作

| 文件操作 | 对应接口                                           |
| -------- | -------------------------------------------------- |
| 打开文件 | `file_object open(path, open_mode)`                |
| 关闭文件 | `file_object.close()`                              |
| 写入文件 | `file_object.write(output_string)`                 |
| 读取文件 | `input_string file_object.read(input_char_number)` |

### 8.1 打开关闭文件

```python
# 打开文件
f_obj = open('/Users/yyo/Project/Python/Test/test.txt', 'w')
f_obj = open('/Users/yyo/Project/Python/Test/test.txt', 'r')
f_obj = open('/Users/yyo/Project/Python/Test/test.txt', 'a')

# 关闭文件
f_obj.close();
```

- 以`w`方式打开文件，会直接清空文件内容。
- 以`a`方式打开文件，不会清空文件，再次写入会追加到原有内容到末尾。
- 如果以`r`方式打开文件并进行写入，会抛异常。

### 8.2 读写文件

```python
# 写入文件
f_obj.write('hello world');

# 读取文件
result = file.read(20 + 3)  # 3 * \n
print(result)
#床前明月光
#疑是地上霜
#举头望明月
#低头思故乡

for line in file:
    print(f'line={line}', end='')
    
lines = file.readlines()
print(lines)
```

### 8.3 上下文管理器

上下文管理器可以自动释放关闭出作用域的文件资源，和C++中的智能指针类似。

```python
def func():
    with open('/Users/yyo/Project/Python/Test/test.txt', 'r') as f:
        # 文件处理
    return
```
