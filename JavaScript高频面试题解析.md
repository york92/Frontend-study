下面这组 **JS 高频题**，本质上考的是三层能力：

**第一层：概念是否清楚。**
比如原型链、闭包、this、Promise、事件循环。

**第二层：能不能解释底层机制。**
比如 `new` 到底做了什么，`async/await` 为什么看起来像同步，Promise 为什么回调进微任务队列。

**第三层：能不能手写应用。**
比如深拷贝、防抖节流、并发请求控制。

---

# 1. 说一下原型链

## 面试回答

JavaScript 是基于原型的语言。每个对象内部都有一个隐藏属性 `[[Prototype]]`，在 JS 中可以通过 `__proto__` 访问，也可以用 `Object.getPrototypeOf(obj)` 获取。

当我们访问一个对象的属性时，JS 会先在对象自身查找。如果找不到，就会沿着它的原型对象继续查找，一直向上，直到 `null`。这条查找路径就是原型链。

例如：

```js
function Person(name) {
  this.name = name;
}

Person.prototype.sayHi = function () {
  console.log('Hi, I am ' + this.name);
};

const p = new Person('Tom');

p.sayHi();
```

这里 `p` 自身没有 `sayHi` 方法，于是会去 `p.__proto__` 上找。
而 `p.__proto__ === Person.prototype`，所以能找到 `sayHi`。

---

## 原型链关系

```js
p.__proto__ === Person.prototype
Person.prototype.__proto__ === Object.prototype
Object.prototype.__proto__ === null
```

所以大概是：

```js
p
 ↓
Person.prototype
 ↓
Object.prototype
 ↓
null
```

---

## constructor 是什么？

```js
Person.prototype.constructor === Person
```

默认情况下，函数的 `prototype` 对象上有一个 `constructor` 属性，指回构造函数本身。

但是如果你直接重写原型：

```js
Person.prototype = {
  sayHi() {}
};
```

这时候 `constructor` 会丢失，需要手动补回来：

```js
Person.prototype = {
  constructor: Person,
  sayHi() {}
};
```

---

## 面试容易追问：`prototype` 和 `__proto__` 区别

### `prototype`

只有函数才有，主要用于构造函数创建实例时，让实例的原型指向它。

```js
function Foo() {}

Foo.prototype
```

### `__proto__`

几乎所有对象都有，表示当前对象的原型。

```js
const obj = {};
obj.__proto__ === Object.prototype;
```

### 总结

```js
function Foo() {}

const f = new Foo();

f.__proto__ === Foo.prototype;
Foo.prototype.constructor === Foo;
```

---

# 2. 说一下闭包

## 面试回答

闭包是指：**函数可以访问并记住它定义时所在的词法作用域，即使这个函数在外部执行。**

简单说，就是函数内部引用了外部函数的变量，并且这个内部函数被外部持有，导致外部函数执行结束后，它的变量不会被销毁。

例如：

```js
function createCounter() {
  let count = 0;

  return function () {
    count++;
    return count;
  };
}

const counter = createCounter();

console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

`createCounter` 已经执行完了，但 `count` 仍然存在，因为返回的内部函数还在引用它。

---

## 闭包形成的条件

一般来说有三个条件：

```js
function outer() {
  let a = 1;

  function inner() {
    console.log(a);
  }

  return inner;
}
```

1. 函数嵌套函数；
2. 内部函数访问外部函数变量；
3. 内部函数被外部引用，生命周期延长。

---

## 从作用域角度理解闭包

JS 是词法作用域，也就是函数的作用域在定义时确定，而不是调用时确定。

```js
let name = 'global';

function outer() {
  let name = 'outer';

  return function inner() {
    console.log(name);
  };
}

const fn = outer();

fn(); // outer
```

虽然 `fn()` 是在全局执行的，但它打印的是 `outer`，因为它定义在 `outer` 里面。

---

# 3. 闭包有什么应用和风险

## 应用一：数据私有化

```js
function createUser(name) {
  let age = 18;

  return {
    getName() {
      return name;
    },
    getAge() {
      return age;
    },
    setAge(newAge) {
      if (newAge > 0) {
        age = newAge;
      }
    }
  };
}

const user = createUser('Tom');

console.log(user.getName()); // Tom
console.log(user.getAge());  // 18

user.setAge(20);
console.log(user.getAge());  // 20
```

外部不能直接访问 `age`，只能通过暴露的方法操作它。

---

## 应用二：函数柯里化

```js
function add(a) {
  return function (b) {
    return a + b;
  };
}

const add10 = add(10);

console.log(add10(5)); // 15
console.log(add10(8)); // 18
```

`add10` 记住了外部传入的 `a = 10`。

---

## 应用三：防抖、节流

防抖和节流本质上都依赖闭包保存定时器、时间戳等状态。

```js
function debounce(fn, delay) {
  let timer = null;

  return function (...args) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
```

这里 `timer` 就被闭包保存了。

---

## 应用四：模块化

早期没有 ES Module 的时候，经常用闭包模拟模块。

```js
const module = (function () {
  let count = 0;

  function increase() {
    count++;
  }

  function getCount() {
    return count;
  }

  return {
    increase,
    getCount
  };
})();

module.increase();
console.log(module.getCount()); // 1
```

---

## 风险一：内存泄漏

闭包会延长变量生命周期，如果闭包长期存在，里面引用的大对象就无法被垃圾回收。

```js
function createHandler() {
  const bigData = new Array(1000000).fill('*');

  return function () {
    console.log(bigData.length);
  };
}

const handler = createHandler();
```

只要 `handler` 一直存在，`bigData` 就不会被释放。

---

## 风险二：循环变量问题

经典问题：

```js
for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 1000);
}
```

输出：

```js
3
3
3
```

因为 `var` 是函数作用域，三个定时器共享同一个 `i`。

解决方式一：使用 `let`

```js
for (let i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 1000);
}
```

输出：

```js
0
1
2
```

解决方式二：IIFE

```js
for (var i = 0; i < 3; i++) {
  (function (j) {
    setTimeout(function () {
      console.log(j);
    }, 1000);
  })(i);
}
```

---

# 4. this 指向规则

## 面试回答

`this` 的指向不是由函数定义位置决定的，而是由函数调用方式决定的。常见规则有五种：

1. 默认绑定；
2. 隐式绑定；
3. 显式绑定；
4. new 绑定；
5. 箭头函数绑定。

---

## 规则一：默认绑定

```js
function foo() {
  console.log(this);
}

foo();
```

非严格模式下，`this` 指向 `window`。
严格模式下，`this` 是 `undefined`。

```js
'use strict';

function foo() {
  console.log(this);
}

foo(); // undefined
```

---

## 规则二：隐式绑定

谁调用，`this` 就指向谁。

```js
const obj = {
  name: 'Tom',
  sayName() {
    console.log(this.name);
  }
};

obj.sayName(); // Tom
```

这里 `sayName` 是通过 `obj` 调用的，所以 `this` 指向 `obj`。

---

## 隐式绑定丢失

```js
const obj = {
  name: 'Tom',
  sayName() {
    console.log(this.name);
  }
};

const fn = obj.sayName;

fn();
```

这里 `fn()` 是普通函数调用，`this` 不再指向 `obj`。

---

## 规则三：显式绑定

通过 `call`、`apply`、`bind` 手动指定 `this`。

```js
function sayName(age) {
  console.log(this.name, age);
}

const obj = {
  name: 'Tom'
};

sayName.call(obj, 18);     // Tom 18
sayName.apply(obj, [18]);  // Tom 18

const fn = sayName.bind(obj);
fn(18); // Tom 18
```

区别：

```js
fn.call(thisArg, arg1, arg2)
fn.apply(thisArg, [arg1, arg2])
fn.bind(thisArg, arg1, arg2)
```

`call` 和 `apply` 会立即执行。
`bind` 不会立即执行，而是返回一个新函数。

---

## 规则四：new 绑定

```js
function Person(name) {
  this.name = name;
}

const p = new Person('Tom');

console.log(p.name); // Tom
```

通过 `new` 调用函数时，`this` 指向新创建的对象。

---

## 规则五：箭头函数

箭头函数没有自己的 `this`，它的 `this` 来自定义时外层作用域。

```js
const obj = {
  name: 'Tom',
  sayName() {
    const fn = () => {
      console.log(this.name);
    };

    fn();
  }
};

obj.sayName(); // Tom
```

箭头函数里的 `this` 继承自 `sayName`，所以是 `obj`。

---

## this 优先级

一般来说：

```js
new 绑定 > 显式绑定 > 隐式绑定 > 默认绑定
```

箭头函数比较特殊，它没有自己的 `this`，不能通过 `call`、`apply`、`bind` 改变。

```js
const obj = {
  name: 'Tom'
};

const fn = () => {
  console.log(this.name);
};

fn.call(obj); // 不能改变箭头函数 this
```

---

# 5. 箭头函数和普通函数区别

## 区别一：this 不同

普通函数的 `this` 由调用方式决定。

```js
function foo() {
  console.log(this);
}
```

箭头函数没有自己的 `this`，它继承外层作用域的 `this`。

```js
const foo = () => {
  console.log(this);
};
```

---

## 区别二：箭头函数不能作为构造函数

```js
const Person = (name) => {
  this.name = name;
};

const p = new Person('Tom'); // TypeError
```

因为箭头函数没有 `[[Construct]]`，不能被 `new` 调用。

---

## 区别三：箭头函数没有 prototype

```js
function Foo() {}

const Bar = () => {};

console.log(Foo.prototype); // 有
console.log(Bar.prototype); // undefined
```

---

## 区别四：箭头函数没有 arguments

```js
function foo() {
  console.log(arguments);
}

foo(1, 2, 3);
```

箭头函数没有自己的 `arguments`：

```js
const foo = () => {
  console.log(arguments); // 取外层 arguments，或者报错
};
```

一般用剩余参数替代：

```js
const foo = (...args) => {
  console.log(args);
};

foo(1, 2, 3);
```

---

## 区别五：箭头函数不能用作 Generator

普通函数可以：

```js
function* gen() {
  yield 1;
}
```

箭头函数不可以写成：

```js
const gen = *() => {}; // 错误
```

---

## 使用建议

适合用箭头函数的场景：

```js
array.map(item => item * 2);

setTimeout(() => {
  console.log(this.name);
}, 1000);
```

不适合用箭头函数的场景：

```js
const obj = {
  name: 'Tom',
  sayName: () => {
    console.log(this.name);
  }
};

obj.sayName(); // this 不指向 obj
```

对象方法、构造函数、需要动态 `this` 的函数，不建议用箭头函数。

---

# 6. new 做了什么

## 面试回答

`new` 调用构造函数时，主要做了四件事：

1. 创建一个新的空对象；
2. 让这个对象的原型指向构造函数的 `prototype`；
3. 将构造函数内部的 `this` 指向这个新对象，并执行构造函数；
4. 如果构造函数返回的是对象，则返回这个对象；否则返回新创建的对象。

---

## 示例

```js
function Person(name) {
  this.name = name;
}

const p = new Person('Tom');
```

等价于：

```js
const obj = {};
obj.__proto__ = Person.prototype;
Person.call(obj, 'Tom');
```

---

## 手写 new

```js
function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);

  const result = Constructor.apply(obj, args);

  const isObject =
    result !== null && (typeof result === 'object' || typeof result === 'function');

  return isObject ? result : obj;
}
```

测试：

```js
function Person(name) {
  this.name = name;
}

Person.prototype.sayHi = function () {
  console.log('Hi ' + this.name);
};

const p = myNew(Person, 'Tom');

console.log(p.name); // Tom
p.sayHi();           // Hi Tom
console.log(p instanceof Person); // true
```

---

## 构造函数返回对象的情况

```js
function Foo() {
  this.name = 'Tom';

  return {
    name: 'Jerry'
  };
}

const f = new Foo();

console.log(f.name); // Jerry
```

如果返回的是基本类型，会被忽略：

```js
function Foo() {
  this.name = 'Tom';

  return 123;
}

const f = new Foo();

console.log(f.name); // Tom
```

---

# 7. Promise 原理

## 面试回答

Promise 是一种异步编程解决方案，用来解决回调地狱问题。它有三种状态：

```js
pending
fulfilled
rejected
```

状态只能从 `pending` 变成 `fulfilled` 或 `rejected`，一旦改变就不能再变。

```js
const p = new Promise((resolve, reject) => {
  resolve('success');
});

p.then(value => {
  console.log(value);
});
```

---

## Promise 的核心机制

Promise 内部主要做了这些事情：

1. 初始化状态为 `pending`；
2. 执行传入的 executor 函数；
3. 调用 `resolve` 时，状态变为 `fulfilled`；
4. 调用 `reject` 时，状态变为 `rejected`；
5. `then` 会根据状态执行成功或失败回调；
6. 如果状态还是 `pending`，就把回调保存起来，等状态改变后再执行；
7. `then` 返回新的 Promise，所以可以链式调用。

---

## 简单版 Promise

```js
class MyPromise {
  constructor(executor) {
    this.status = 'pending';
    this.value = undefined;
    this.reason = undefined;

    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.status !== 'pending') return;

      this.status = 'fulfilled';
      this.value = value;

      this.onFulfilledCallbacks.forEach(fn => fn());
    };

    const reject = (reason) => {
      if (this.status !== 'pending') return;

      this.status = 'rejected';
      this.reason = reason;

      this.onRejectedCallbacks.forEach(fn => fn());
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled =
      typeof onFulfilled === 'function'
        ? onFulfilled
        : value => value;

    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            throw reason;
          };

    return new MyPromise((resolve, reject) => {
      if (this.status === 'fulfilled') {
        setTimeout(() => {
          try {
            const result = onFulfilled(this.value);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      }

      if (this.status === 'rejected') {
        setTimeout(() => {
          try {
            const result = onRejected(this.reason);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      }

      if (this.status === 'pending') {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              const result = onFulfilled(this.value);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
        });

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const result = onRejected(this.reason);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
        });
      }
    });
  }
}
```

这只是简化版。真正的 Promise 还要处理：

```js
thenable
Promise 递归解析
循环引用检测
微任务调度
静态方法 Promise.all / race / allSettled / any
```

---

## Promise 链式调用

```js
Promise.resolve(1)
  .then(res => {
    console.log(res); // 1
    return res + 1;
  })
  .then(res => {
    console.log(res); // 2
    return Promise.resolve(res + 1);
  })
  .then(res => {
    console.log(res); // 3
  });
```

关键点：

```js
then 返回的是一个新的 Promise
```

所以后一个 `then` 接收的是前一个 `then` 的返回值。

---

## Promise 错误穿透

```js
Promise.resolve()
  .then(() => {
    throw new Error('error');
  })
  .then(() => {
    console.log('不会执行');
  })
  .catch(err => {
    console.log(err.message); // error
  });
```

如果中间没有处理错误，错误会一直向后传递，直到被 `catch` 捕获。

---

# 8. async/await 原理

## 面试回答

`async/await` 是 Promise 的语法糖，本质上是 Generator 函数和自动执行器的封装。

`async` 函数一定返回 Promise。
`await` 后面通常跟一个 Promise，它会暂停当前 async 函数的执行，等待 Promise 状态完成后，再继续执行后面的代码。

例如：

```js
async function getData() {
  const res = await fetch('/api/data');
  const data = await res.json();

  return data;
}
```

等价于 Promise 链式写法：

```js
function getData() {
  return fetch('/api/data')
    .then(res => res.json())
    .then(data => data);
}
```

---

## async 函数返回值

```js
async function foo() {
  return 123;
}

foo().then(res => {
  console.log(res); // 123
});
```

等价于：

```js
function foo() {
  return Promise.resolve(123);
}
```

---

## await 后面的值

如果 `await` 后面是 Promise：

```js
async function foo() {
  const res = await Promise.resolve(123);
  console.log(res);
}

foo(); // 123
```

如果 `await` 后面是普通值：

```js
async function foo() {
  const res = await 123;
  console.log(res);
}

foo(); // 123
```

普通值会被包装成：

```js
Promise.resolve(123)
```

---

## await 会让后续代码进入微任务

```js
async function foo() {
  console.log(1);
  await Promise.resolve();
  console.log(2);
}

console.log(3);
foo();
console.log(4);
```

输出：

```js
3
1
4
2
```

原因：

```js
await 后面的代码，相当于放进 Promise.then 里面执行
```

类似于：

```js
function foo() {
  console.log(1);

  return Promise.resolve().then(() => {
    console.log(2);
  });
}
```

---

## 错误处理

```js
async function getData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}
```

等价于：

```js
fetch('/api/data')
  .then(res => res.json())
  .catch(error => {
    console.error(error);
  });
```

---

## 常见坑：串行和并行

### 串行

```js
async function run() {
  const a = await requestA();
  const b = await requestB();
  const c = await requestC();

  return [a, b, c];
}
```

这三个请求是一个接一个执行。

### 并行

```js
async function run() {
  const [a, b, c] = await Promise.all([
    requestA(),
    requestB(),
    requestC()
  ]);

  return [a, b, c];
}
```

三个请求同时发起，整体耗时更短。

---

# 9. 事件循环输出题

## 核心规则

JS 是单线程执行的。同步代码先执行，异步任务进入任务队列。

异步任务分为：

```js
宏任务：setTimeout、setInterval、setImmediate、I/O、UI 渲染等
微任务：Promise.then、catch、finally、queueMicrotask、MutationObserver 等
```

执行顺序：

```js
执行一个宏任务
      ↓
执行所有同步代码
      ↓
清空所有微任务
      ↓
执行下一个宏任务
      ↓
再次清空微任务
```

---

## 题目一

```js
console.log(1);

setTimeout(() => {
  console.log(2);
}, 0);

Promise.resolve().then(() => {
  console.log(3);
});

console.log(4);
```

输出：

```js
1
4
3
2
```

原因：

```js
1、4 是同步代码
Promise.then 是微任务
setTimeout 是宏任务
```

---

## 题目二

```js
console.log('start');

setTimeout(() => {
  console.log('timeout');
}, 0);

Promise.resolve()
  .then(() => {
    console.log('promise1');
  })
  .then(() => {
    console.log('promise2');
  });

console.log('end');
```

输出：

```js
start
end
promise1
promise2
timeout
```

---

## 题目三：async/await

```js
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => {
  console.log('promise2');
});

console.log('script end');
```

输出：

```js
script start
async1 start
async2
promise1
script end
async1 end
promise2
setTimeout
```

解释：

同步部分先执行：

```js
script start
async1 start
async2
promise1
script end
```

`await async2()` 后面的：

```js
console.log('async1 end')
```

进入微任务队列。

`promise.then` 也进入微任务队列。

因为 `async1 end` 先入队，所以先输出：

```js
async1 end
promise2
```

最后执行宏任务：

```js
setTimeout
```

---

## 题目四：微任务里创建微任务

```js
console.log(1);

Promise.resolve().then(() => {
  console.log(2);

  Promise.resolve().then(() => {
    console.log(3);
  });
});

Promise.resolve().then(() => {
  console.log(4);
});

console.log(5);
```

输出：

```js
1
5
2
4
3
```

原因：

同步代码：

```js
1
5
```

微任务队列初始是：

```js
then输出2
then输出4
```

执行第一个微任务输出 `2`，里面又注册一个微任务 `3`，它会追加到微任务队列尾部。

所以顺序是：

```js
2
4
3
```

---

# 10. 宏任务和微任务区别

## 面试回答

宏任务和微任务都是异步任务，但它们进入的队列不同，执行优先级也不同。

每执行完一个宏任务，都会清空当前所有微任务，然后才会执行下一个宏任务。

---

## 常见宏任务

```js
script 整体代码
setTimeout
setInterval
setImmediate // Node.js
I/O
UI rendering
requestAnimationFrame
```

注意：整体 script 代码本身也可以看作第一个宏任务。

---

## 常见微任务

```js
Promise.then
Promise.catch
Promise.finally
queueMicrotask
MutationObserver
process.nextTick // Node.js，优先级比 Promise 更高
```

---

## 对比

| 类型  | 例子                            | 执行时机             |
| --- | ----------------------------- | ---------------- |
| 宏任务 | setTimeout、setInterval、script | 一轮事件循环执行一个       |
| 微任务 | Promise.then、queueMicrotask   | 当前宏任务结束后立即清空     |
| 优先级 | 微任务高于下一个宏任务                   | 先清空微任务，再执行下一个宏任务 |

---

## 面试中的核心表达

可以这样说：

> JS 会先执行当前宏任务中的同步代码，执行完后清空微任务队列，然后再执行下一个宏任务。所以 Promise.then 一般会早于 setTimeout 执行。

---

# 11. ES Module 和 CommonJS 区别

## 面试回答

CommonJS 是 Node.js 早期使用的模块规范，使用 `require` 和 `module.exports`。
ES Module 是 ES6 官方模块规范，使用 `import` 和 `export`。

---

## CommonJS

```js
// a.js
const name = 'Tom';

function sayHi() {
  console.log(name);
}

module.exports = {
  name,
  sayHi
};
```

```js
// b.js
const mod = require('./a');

console.log(mod.name);
mod.sayHi();
```

---

## ES Module

```js
// a.js
export const name = 'Tom';

export function sayHi() {
  console.log(name);
}
```

```js
// b.js
import { name, sayHi } from './a.js';

console.log(name);
sayHi();
```

---

## 区别一：加载时机不同

CommonJS 是运行时加载。

```js
const mod = require('./a');
```

`require` 可以放在条件语句中：

```js
if (isDev) {
  const devTool = require('./devTool');
}
```

ES Module 是编译时加载，静态分析。

```js
import { name } from './a.js';
```

`import` 一般不能随便放在条件语句中：

```js
if (isDev) {
  import { name } from './a.js'; // 静态 import 不能这样写
}
```

动态导入要用：

```js
if (isDev) {
  import('./a.js').then(mod => {
    console.log(mod.name);
  });
}
```

---

## 区别二：输出值不同

CommonJS 输出的是值的拷贝，准确说是导出对象属性值的拷贝或引用。

```js
// counter.js
let count = 0;

function increase() {
  count++;
}

module.exports = {
  count,
  increase
};
```

```js
const counter = require('./counter');

console.log(counter.count); // 0
counter.increase();
console.log(counter.count); // 0
```

因为导出时 `count` 的值是 `0`。

但如果导出 getter 或对象引用，则可以看到变化。

---

ES Module 输出的是动态绑定，导入方可以感知导出变量变化。

```js
// counter.js
export let count = 0;

export function increase() {
  count++;
}
```

```js
import { count, increase } from './counter.js';

console.log(count); // 0
increase();
console.log(count); // 1
```

---

## 区别三：this 指向不同

CommonJS 顶层 `this` 指向当前模块的 `exports`。

```js
console.log(this === module.exports); // true
```

ES Module 顶层 `this` 是 `undefined`。

```js
console.log(this); // undefined
```

---

## 区别四：循环引用处理不同

CommonJS 遇到循环引用时，会输出当前已经执行的部分。

ES Module 因为是静态分析和动态绑定，对循环引用支持更好，但也容易遇到暂时性死区问题。

---

## 区别五：Tree Shaking

ES Module 更适合 Tree Shaking，因为它是静态结构。

```js
import { add } from './utils';
```

构建工具可以分析你到底用了哪些导出。

CommonJS 是运行时加载：

```js
const utils = require('./utils');
```

静态分析难度更高。

---

## 总结表

| 对比项          | CommonJS                 | ES Module         |
| ------------ | ------------------------ | ----------------- |
| 语法           | require / module.exports | import / export   |
| 加载时机         | 运行时加载                    | 编译时加载             |
| 导出特点         | 值拷贝或对象引用                 | 动态绑定              |
| 是否静态分析       | 较弱                       | 强                 |
| Tree Shaking | 不友好                      | 友好                |
| 顶层 this      | module.exports           | undefined         |
| 常见场景         | Node.js 旧项目              | 浏览器、现代前端、Node 新项目 |

---

# 12. 深拷贝怎么实现

## 面试回答

深拷贝是指拷贝一个对象时，不仅拷贝对象本身，还递归拷贝它内部引用类型的数据，保证新对象和原对象互不影响。

浅拷贝只复制第一层：

```js
const obj = {
  name: 'Tom',
  info: {
    age: 18
  }
};

const copy = { ...obj };

copy.info.age = 20;

console.log(obj.info.age); // 20
```

因为 `info` 仍然是同一个对象。

---

## 方法一：JSON 深拷贝

```js
const copy = JSON.parse(JSON.stringify(obj));
```

优点：简单。

缺点很多：

```js
无法拷贝 undefined
无法拷贝 function
无法拷贝 Symbol
无法处理循环引用
Date 会变成字符串
RegExp 会变成空对象
Map / Set 处理不了
```

---

## 方法二：structuredClone

现代浏览器支持：

```js
const copy = structuredClone(obj);
```

优点：原生、强大、支持循环引用、Map、Set、Date 等。

缺点：不能克隆函数、DOM 节点等。

---

## 方法三：手写深拷贝

基础版：

```js
function deepClone(target) {
  if (target === null || typeof target !== 'object') {
    return target;
  }

  const cloneTarget = Array.isArray(target) ? [] : {};

  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      cloneTarget[key] = deepClone(target[key]);
    }
  }

  return cloneTarget;
}
```

---

## 完整加强版

```js
function deepClone(target, weakMap = new WeakMap()) {
  if (target === null || typeof target !== 'object') {
    return target;
  }

  if (target instanceof Date) {
    return new Date(target);
  }

  if (target instanceof RegExp) {
    return new RegExp(target.source, target.flags);
  }

  if (target instanceof Map) {
    const clonedMap = new Map();

    weakMap.set(target, clonedMap);

    target.forEach((value, key) => {
      const clonedKey = deepClone(key, weakMap);
      const clonedValue = deepClone(value, weakMap);
      clonedMap.set(clonedKey, clonedValue);
    });

    return clonedMap;
  }

  if (target instanceof Set) {
    const clonedSet = new Set();

    weakMap.set(target, clonedSet);

    target.forEach((value) => {
      clonedSet.add(deepClone(value, weakMap));
    });

    return clonedSet;
  }

  if (weakMap.has(target)) {
    return weakMap.get(target);
  }

  const cloneTarget = Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target));

  weakMap.set(target, cloneTarget);

  Reflect.ownKeys(target).forEach((key) => {
    cloneTarget[key] = deepClone(target[key], weakMap);
  });

  return cloneTarget;
}
```

测试循环引用：

```js
const obj = {
  name: 'Tom'
};

obj.self = obj;

const copy = deepClone(obj);

console.log(copy.name); // Tom
console.log(copy.self === copy); // true
console.log(copy.self === obj);  // false
```

---

## 面试重点

你可以这样说：

> 简单场景可以用 JSON，但它有很多限制。现代环境可以用 structuredClone。手写深拷贝时要注意递归、数组和对象区分、Symbol key、Date、RegExp、Map、Set，以及循环引用。循环引用一般用 WeakMap 解决。

---

# 13. 防抖节流怎么实现

## 防抖 debounce

### 概念

防抖是指：事件频繁触发时，只有最后一次触发后等待一段时间，才真正执行函数。

典型场景：

```js
搜索框输入联想
窗口 resize
表单输入校验
按钮防重复提交
```

---

## 防抖基础版

```js
function debounce(fn, delay) {
  let timer = null;

  return function (...args) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
```

使用：

```js
const input = document.querySelector('input');

input.addEventListener(
  'input',
  debounce(function (e) {
    console.log(e.target.value);
  }, 500)
);
```

---

## 防抖立即执行版

有时候希望第一次立即执行，后面频繁触发不执行。

```js
function debounce(fn, delay, immediate = false) {
  let timer = null;

  return function (...args) {
    const context = this;

    if (timer) {
      clearTimeout(timer);
    }

    if (immediate) {
      const shouldCallNow = !timer;

      timer = setTimeout(() => {
        timer = null;
      }, delay);

      if (shouldCallNow) {
        fn.apply(context, args);
      }
    } else {
      timer = setTimeout(() => {
        fn.apply(context, args);
      }, delay);
    }
  };
}
```

---

## 节流 throttle

### 概念

节流是指：事件频繁触发时，固定时间间隔内最多执行一次。

典型场景：

```js
滚动加载
拖拽
鼠标移动
页面滚动监听
高频点击
```

---

## 节流时间戳版

```js
function throttle(fn, delay) {
  let lastTime = 0;

  return function (...args) {
    const now = Date.now();

    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}
```

特点：第一次会立即执行，但最后一次不一定执行。

---

## 节流定时器版

```js
function throttle(fn, delay) {
  let timer = null;

  return function (...args) {
    if (timer) return;

    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}
```

特点：第一次不会立即执行，但最后一次一般会执行。

---

## 节流综合版

```js
function throttle(fn, delay) {
  let lastTime = 0;
  let timer = null;

  return function (...args) {
    const context = this;
    const now = Date.now();
    const remaining = delay - (now - lastTime);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      lastTime = now;
      fn.apply(context, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastTime = Date.now();
        timer = null;
        fn.apply(context, args);
      }, remaining);
    }
  };
}
```

---

## 防抖和节流区别

| 对比项    | 防抖         | 节流           |
| ------ | ---------- | ------------ |
| 核心思想   | 等用户停下来再执行  | 固定间隔执行       |
| 高频触发期间 | 一直不执行，直到停止 | 按间隔执行        |
| 常见场景   | 搜索输入、表单校验  | 滚动、拖拽、resize |
| 关键词    | 最后一次       | 固定频率         |

---

# 14. 如何实现并发请求控制

## 面试回答

并发请求控制是指：有一批异步任务，但不能一次性全部发出去，而是限制同时执行的数量，比如最多同时请求 3 个。当前某个请求完成后，再从队列中取下一个请求执行。

常见场景：

```js
批量上传图片
批量下载文件
大列表接口请求
爬取资源
前端限制请求压力
```

---

## 示例需求

有 10 个请求，但最多只能同时执行 3 个。

```js
const tasks = [
  () => request('/api/1'),
  () => request('/api/2'),
  () => request('/api/3'),
  ...
];
```

---

## 实现方式一：Promise 池

```js
function limitRequest(tasks, limit) {
  return new Promise((resolve, reject) => {
    const results = [];
    let index = 0;
    let running = 0;
    let finished = 0;

    function runNext() {
      if (finished === tasks.length) {
        resolve(results);
        return;
      }

      while (running < limit && index < tasks.length) {
        const currentIndex = index;
        const task = tasks[index];

        index++;
        running++;

        Promise.resolve()
          .then(() => task())
          .then((res) => {
            results[currentIndex] = res;
          })
          .catch((err) => {
            results[currentIndex] = err;
          })
          .finally(() => {
            running--;
            finished++;
            runNext();
          });
      }
    }

    runNext();
  });
}
```

使用：

```js
function createTask(id, delay) {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log('完成任务', id);
        resolve(id);
      }, delay);
    });
}

const tasks = [
  createTask(1, 1000),
  createTask(2, 500),
  createTask(3, 800),
  createTask(4, 1200),
  createTask(5, 300)
];

limitRequest(tasks, 2).then((results) => {
  console.log('全部完成', results);
});
```

---

## 实现方式二：async/await 版本

```js
async function limitRequest(tasks, limit) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index;
      const task = tasks[currentIndex];

      index++;

      try {
        results[currentIndex] = await task();
      } catch (error) {
        results[currentIndex] = error;
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    () => worker()
  );

  await Promise.all(workers);

  return results;
}
```

这个写法非常适合面试，因为逻辑清晰：

```js
创建 limit 个 worker
每个 worker 不断从任务队列里取任务
直到所有任务执行完
最后 Promise.all 等待所有 worker 完成
```

---

## 并发控制重点

并发控制不是限制总请求数量，而是限制同一时间正在执行的请求数量。

比如：

```js
limit = 3
```

表示最多同时有 3 个请求在 pending 状态。

完成一个，就补一个。

---

# 15. 最后一套面试表达模板

你可以按这个方式回答，比较像五年前端的表达：

---

## 原型链

> JS 是基于原型的语言。每个对象都有一个内部原型，当访问属性时，会先查找对象自身，如果自身没有，就沿着原型对象继续向上查找，直到 Object.prototype，最后到 null，这条查找路径就是原型链。实例的 `__proto__` 指向构造函数的 `prototype`，构造函数的 `prototype.constructor` 默认指回构造函数本身。

---

## 闭包

> 闭包是函数和它定义时词法作用域的组合。内部函数引用了外部函数的变量，并且内部函数被外部持有时，外部函数执行结束后，这些变量也不会被销毁。常见应用有数据私有化、模块化、柯里化、防抖节流等。风险是可能导致变量长期被引用，造成内存泄漏。

---

## this

> this 的指向主要由调用方式决定。普通函数有默认绑定、隐式绑定、显式绑定和 new 绑定。箭头函数没有自己的 this，它的 this 来自定义时外层作用域，不能通过 call、apply、bind 改变。

---

## new

> new 会创建一个新对象，让新对象的原型指向构造函数的 prototype，然后用这个新对象作为 this 执行构造函数，最后根据构造函数返回值决定返回结果。如果返回对象，则返回该对象，否则返回新创建的实例。

---

## Promise

> Promise 是异步编程解决方案，有 pending、fulfilled、rejected 三种状态。状态一旦改变就不可逆。then 会返回新的 Promise，所以可以链式调用。Promise 回调会进入微任务队列，因此通常比 setTimeout 先执行。

---

## async/await

> async/await 是 Promise 的语法糖。async 函数一定返回 Promise。await 会暂停当前 async 函数后续代码的执行，把 await 后面的逻辑放到微任务中，等 Promise 状态完成后再继续执行。

---

## 事件循环

> JS 会先执行同步代码，然后清空微任务队列，再执行下一个宏任务。每执行完一个宏任务，都会清空当前产生的所有微任务。Promise.then、queueMicrotask 属于微任务，setTimeout、setInterval 属于宏任务。

---

## ES Module 和 CommonJS

> CommonJS 是运行时加载，使用 require 和 module.exports；ES Module 是编译时静态加载，使用 import 和 export。ES Module 支持静态分析和 Tree Shaking，导出是动态绑定；CommonJS 更偏运行时，导出更像对象值的传递。

---

## 深拷贝

> 深拷贝需要递归复制对象内部的引用类型，并且要处理数组、对象、Date、RegExp、Map、Set、Symbol key 和循环引用。简单场景可以用 JSON，但限制很多。现代浏览器可以用 structuredClone，手写时通常用 WeakMap 解决循环引用。

---

## 防抖节流

> 防抖是频繁触发后只执行最后一次，适合搜索输入、表单校验。节流是固定时间间隔内最多执行一次，适合滚动、拖拽、resize。两者核心都是通过闭包保存 timer 或时间戳。

---

## 并发请求控制

> 并发控制是维护一个任务队列和一个运行中的任务数量。开始时执行 limit 个任务，每完成一个任务，就从队列中取下一个补上，直到所有任务完成。关键是限制同一时间 pending 的请求数量，而不是限制请求总数。
