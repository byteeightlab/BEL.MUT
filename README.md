# Mutation [BEL.MUT]
Библиотека, которая облегчает создание сложных анимаций с использованием CSS и JavaScript. Она добавляет метод mutation к элементам DOM, позволяющий JavaScript дождаться завершения анимации, проигрываемой через CSS.

## Подключение

Скопируйте репозиторий в нужную папку, например в js.

```bash
git clone https://github.com/byteeightlab/BEL.MUT.git
```

Подключите в html документе. Скрипт **mutation.bel.js** подключается перед остальными скриптами.

```html
<script src="/js/BEL.MUT/mutation.bel.js" type="text/javascript"></script>
```

## Методы

#### Изменение элемента

```js
Element.mutation( Object data ) : Promise
```

Изменяет стили или классы DOM элемента. Если в css для данного элемента объявлено transition или animation, дождется его завершения ( учитывая duration, delay, iteration-count ). 

**data** - Объект. Может содержать следующие свойства:
- **style** - Объект. Изменить стили элемента
- **class** - Объект. Изменить классы элемента 
    - **add** - Массив. Добавить классы
    - **remove** - Массив. Удалить классы
- **trigger** - Строка. Триггер, если задан будет вызвано событие mutationComplete
- **duration** - Число или строка. Изменить стандартную продолжительность ( заданную через css ), не влияет на саму анимацию, указывает когда сработает then. Может быть задано в процентах "50%" или в миллисекундах "100". Может быть отрицательным, например "-10%" будет означаться что then сработает через "90%" анимации ( учитывая duration, delay, iteration-count ). 

```js
let target = document.querySelector('.target');

target.mutation({
    style: {
        marginTop: '1em', /* или */ 'margin-top:': '1em', // Оба варианта корректные
        marginBottom: '' // Удаляет ранее переданное значение из атрибута style
    },
    class: { // Удаляем класс rest, добавляем job
        add: ['job'],
        remove: ['rest']
    },
    trigger: 'target',
    duration: '50%' // then сработает на середине, анимация при этом продолжиться
}).then( performed => console.log('Complete! (Promise)') );

// Событие вызванное trigger
target.addEventListener( 'mutationComplete', e => {
    console.log( 'Complete! (Event)', e.detail.trigger ); // trigger = target
});
```

#### Остановить изменение элемента

```js
Element.mutationStop() : undefined
```

Останавливает анимации. then будет вызван незамедлительно, при этом performed будет содержать false, это необходимо для того что бы прервать цепочку анимаций внутри then.

Пример 1:
```js
let target = document.querySelector('.target');

(async e=>{
    // Очередь анимации, каждая длиться 1 сек.
    if( !await target.mutation({ style: { width: '100px' }}) ) return false;
    if( !await target.mutation({ style: { height: '100px' }}) ) return false; // Остановится тут
    if( !await target.mutation({ style: { width: '200px' }}) ) return false;
    if( !await target.mutation({ style: { height: '200px' }}) ) return false;
    console.log('Complete!') );
})();

setTimeout( e => target.mutationStop(), 1900 );
```

Пример 2:
```js
let target = document.querySelector('.target');

// Очередь анимации, каждая длиться 1 сек.
target.mutation({ style: { width: '100px' }}).then( performed => {
    if( !performed ) return false;
    target.mutation({ style: { height: '100px' }}).then( performed => {
        if( !performed ) return false; // Этот performed будет равен false, тут анимация прервется
        target.mutation({ style: { width: '200px' }}).then( performed => {
            if( !performed ) return false;
            target.mutation({ style: { height: '200px' }}).then( performed => {
                if( !performed ) return false;
                console.log('Complete!') );
            });
        });
    });
});

setTimeout( e => target.mutationStop(), 1900 );
```

#### Изменение группы элементов

```js
NodeList.mutation( Object data ) : Promise
```
Аналогично **Element.mutation**, применяется к списку элементов. Promise всех элементов объединяются в Promise.all, then будет вызван когда все элементы выполнят свою анимацию.
performed содержит массив состояний.

```js
(async e=>{
    let targets = document.querySelectorAll('.targets'), // 4 items
        performed = await targets.mutation({ class: { add: 'open' }});
    // Если содержит хотя бы 1 false, прерываем цепочку
    if( performed.includes(false) ) return;
})();
```

#### Остановить изменение группы элемента

```js
NodeList.mutationStop() : undefined
```

Останавливает анимации у всех элементов в наборе.