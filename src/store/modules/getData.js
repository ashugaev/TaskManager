// FIXME: Сделать минимальную ширину инпута в хедере, когда он пустой, что бы было видно плейсхолдер

/////////////////////////////////////////
// Получаем столы, списки и задачи из БД
/////////////////////////////////////////

import router from './../../Router.js'

import * as firebase from "firebase"
// import routeHandler from "./routeHandlers"

export default {

  actions: {

    /////////////////////////////////////////////////////
    // УПРАВЛЯЮЩАЯ ФУНКЦИЯ ПЕРВИЧНОГО ПОЛУЧЕНИЕ РАБ. СТ.
    /////////////////////////////////////////////////////

    firstGettingData({
      dispatch,
      commit,
      rootState
    }) {
      commit('startTableLoader')
      // 1. Получаем данные по id из users
      dispatch('getUserData')
        .then(response => {
          // 2. Пишем рабочие столы из tables в allTasks
          const settings = response.settings;
          // const obj = new Object();
          dispatch('getSettings', settings);
          //Продолжаем, если есть столы
          if (response.tables != null) {
            rootState.appLog.push('Есть столы ');
            return dispatch('getDataSecondChain');
          } else {
            rootState.appLog.push('firstGettingData - Нет столов для загрузки', response);
            commit('stopTableLoader')
          }
        })
        .catch(error => {
          console.log(error);
          // если есть ошибки на этапе загрузки, то выкидываем попап перезагрузки страницы
          dispatch('linksHandler', {
            toLink: '/error/'
          });
          commit('stopTableLoader')
          rootState.appLog.push('Ошибка загрузки стола в firstGettingData');

        })

    },

    //Cледующая цепочка, которая выполняется тольк если у нас есть

    getDataSecondChain({
      dispatch,
      commit
    }) {
      // console.log('Вторая цепочка пошла');
      dispatch('getUserTables')
        .then(allTables => {
          // 3. Загружаем списки из taskLists в allTasks на каждой итерации вызываю получение задач
          dispatch('getTableTaskLists');
        }).then(() => {
          dispatch('checkUrl');
        })
        .catch(error => {
          console.log(error);
          commit('stopTableLoader')
        })

    },

    ///Инициализация получения списка задач для активного Рабочего Стола, если он был загружен, то выводим из локальной переменную
    /*
      Возможные варианты на входе:
      ---Ни одного стола не загружено
      ---Есть загруженные, но не загружен текущий
      ---Загружены все столы

      Поидее нужно сделать: 
      1. При смене стола отправляем запрос на загрузку
      2. Загрузчик смотрит id стола(индекс наверное нет) и грузит по ним задачи
      3. Если задача уже загружена, то ничего не делает
      4. Если у нас начинается запись задач привязанных не к тому списку или
      списков привязанных не к тому столу, то выдаем эрор и предлагаем перезагрузиться,
      либо насильно перезагружаем.
      5. Если у нас что-либо не догружается, то выдаем ошибку с предложением перезагрузиться, 
      либо нужно добавить систему проверки, что бы она догружала, что нужно.
    */
    startGetTasks({
      dispatch,
      rootState,
      commit
    }) {
      return new Promise((resolve, reject) => {
        rootState.appLog.push('==========================');
        //Если не загружено ни одного стола
        if (rootState.allTasks.length < 1) {
          rootState.appLog.push('Ниодного загруженного стола');
          dispatch('firstGettingData');
        } else {
          //Чистим побочные массивы, если уже загружили столы
          /* 
                    Чистим только массив с задачами, потому что он на каждой странице разный
                     Массив со списками на каждом столе используется только раз при открытии стола, поэтому он может оставиться не изменным
                   */
          rootState.masTasks = []

          //Если есть загруженные, но текущий стол не загружег
          if (rootState.allTasks[rootState.activeTableIndex].taskLists.length < 1) {
            // тогда сразу инициализируем загрузки списков
            rootState.appLog.push('Есть загруженные столы, нет загруженных списков на текущем');
            commit('startTableLoader')
            dispatch('getTableTaskLists');
          } else {
            // если так то это значит, что мы кликнули на уже загруженные РС, поэтому ничего не делаем
            // выполним проверку загруженных спиской и задач в них
            rootState.appLog.push('Этот стол уже загружен');
            commit('stopTableLoader')
          }
        }
      })
    },


    //Получаем данные юзера по его id из БД (users)
    /*
      На входе важен только userId
      Возможные варианты: 
      --Юзер id есть
      ----Все проходит ок
      ----Вылетает ошибка полключение либа любая др
      --Юзер id нет
      ----Мы 100% получаем эрор.
     
     Действия:
        ====Если отсутствует userId то выполняем logOut и юзера автоматом кидает на авторизашку
        ====Если ошибка выполнения функции Предлагаем перезагрузиться, кидаем ошибку аутентификации(получения user id)
     */
    getUserData({
      rootState,
      dispatch
    }) {
      return new Promise((resolve, reject) => {
        const uId = rootState.userId;
        if (!uId) {
          //Выход из лк и редирект на логин     
        }

        firebase
          .database()
          .ref("users/" + uId)
          .once("value")
          .then(data => {
            //Преобразуем объекты столов в массивы
            let arrayLists = [];
            let objLists = {};
            let obj = data.val();
            //Если получили пустой массив-невыполняем часть операций
            //И заменяем на пустой объет
            if (data.val() != null) {
              let objLists = data.val().tables;
              for (var prop in objLists) {
                arrayLists.push({
                  id: objLists[prop]
                });
              };
            } else {
              obj = {}
            }

            rootState.userData = {
              settings: obj.settings
            };

            //Пишел заготовки объектов с id для парсинга
            rootState.masTables = arrayLists;
            rootState.appLog.push('Первичное получение данных по юзеру');
            resolve(obj);
          })

          .catch(error => {
            console.log('Полный провал. Ошибка: ', error);
            rootState.appLog.push('Ошибка на этапе: Первичное получение данных по юзеру');
            dispatch('showBigError', error);
            reject();
          })


      });

    },

    ///Получаем рабочие столы с БД
    getUserTables({
      dispatch,
      commit,
      state,
      rootState
    }) {
      return new Promise((resolve, reject) => {
        const tables = rootState.allTasks
        // if (rootState.masTables.length > 0) {
        if (rootState.masTables != null) {
          rootState.masTables.forEach((element, i) => {
            const tableId = element.id
            firebase
              .database()
              .ref("tables/" + tableId)
              .once('value')
              .then(data => {
                rootState.appLog.push('getUserTables 3');
                //Получим адрес стола. Это будут последние 6 цифр от id
                let tableUrl = tableId.slice(tableId.length - 6);
                // console.log('Вырезанный кусок id ', tableUrl, tableId);

                //Преобразуем объекты в массивы
                let objLists = data.val().taskLists;
                let arrayLists = [];
                for (var prop in objLists) {
                  arrayLists.push({
                    id: objLists[prop]
                  });
                };

                rootState.masTaskLists.push(arrayLists)

                console.log('получили', data.val().bgIndex)
                //Дописываем получанные данные в массив
                tables.push({
                  id: tableId,
                  name: data.val().name,
                  colorId: data.val().colorId,
                  colorOne: data.val().colorOne,
                  colorTwo: data.val().colorTwo,
                  taskLists: [],
                  tableIndex: data.val().tableIndex,
                  tableUrl: tableUrl,
                  bgIndex: data.val().bgIndex
                })

                // console.log('Итерация записи стола', tables);
                // console.log('Итерация записи стола. Целевой массив', rootState.allTasks);
                rootState.appLog.push('getUserTables 2');

                if ((i + 1) == rootState.masTables.length) {
                  // console.log('habra Полкучаем списки задач ', tables, rootState.masTaskLists);
                  rootState.appLog.push('Получили столы юзера');
                  rootState.appRouteLog.push('routeHandlier - вызваем после получения списка столов');
                  dispatch('pushActiveTableLink')
                  resolve(rootState.allTasks);

                }
              })
              .catch(error => {
                console.log('Полный провал. Ошибка: ', error);
                rootState.appLog.push('Ошибка на этапе: Получили столы юзера');
              })

          })
        } else {
          //Повтор проверки в вызывающей функции
          commit('stopTableLoader')
          rootState.appLog.push('Нет столов для загрузки');
        }

      });
    },

    ///ПОДТЯГИВАЕМ СПИСКИ ЗАДАЧ И НА КАЖДОЙ ИТЕРАЦИИ ВЫПОЛНЯЕМ ЦИКЛ ЗАГРУЗКИ ЗАДАЧ
    getTableTaskLists({
      dispatch,
      commit,
      rootState
    }) {
      console.log(rootState.masTables);
      const ind = rootState.activeTableIndex;
      const activeTableId = rootState.masTables[ind].id
      const list = rootState.allTasks[ind].taskLists
      //Выполняем только если у нас есть привязанные к столу списки
      rootState.appLog.push(`Проверяем количество списков ${rootState.masTaskLists[ind].length + ' ' + (rootState.masTaskLists[ind].length > 0)}`)
      if (rootState.masTaskLists[ind].length > 0) {
        //подтягиваем списки активного раб. ст.
        rootState.masTaskLists[ind].forEach((element, index) => {
          const listId = element.id
          firebase
            .database()
            .ref("taskLists/" + listId)
            .once("value")
            .then(data => {


              //Преобразуем объекты задач в массивы
              let objLists = data.val().tasks;
              let arrayLists = [];
              for (var prop in objLists) {
                arrayLists.push({
                  id: objLists[prop]
                });
              };

              //Временный массив c id задач
              rootState.masTasks.push(arrayLists);


              list.push({
                id: listId,
                tableId: activeTableId,
                name: data.val().name,
                color: data.val().color,
                tasks: [],
                listIndex: data.val().listIndex,
                emojiIndex: data.val().emojiIndex,
              })
              let i = index;
              dispatch('getListTasks', {
                i,
                listId
              });
            })
            .catch(error => {
              console.log('Полный провал. Ошибка: ', error);
              rootState.appLog.push('Ошибка на этапе получения списков задач юзера');

            })

          //Ловим последнюю итерацию, что бы отслеживать зевершение этапа
          if ((index + 1) == rootState.masTaskLists[ind].length) {
            // console.log('habra Полкучаем списки задач ', tables, rootState.masTaskLists);
            rootState.appLog.push('Получили списки задач юзера');
          }
        });
      } else {
        commit('stopTableLoader')
        rootState.appLog.push('Загрузка стола завершена. У стола нет списков.');
      }
    },


    ///Получаем задачи очередного списка
    getListTasks({
      dispatch,
      commit,
      state,
      rootState
    }, {
      i,
      listId
    }) {
      // console.log('habra Сформировали id задач', rootState.masTasks, rootState.allTasks);
      const ind = rootState.activeTableIndex;
      const activeTableId = rootState.masTables[ind].id
      let tasks = rootState.allTasks[ind].taskLists[i].tasks
      let indexChecker
      //Выполняем если есть привязанные к списку задачи
      if (tasks.length > 0) {
        rootState.masTasks[i].forEach((element, index) => {
          indexChecker = index
          const taskId = element.id
          firebase
            .database()
            .ref("tasks/" + taskId)
            .once("value")
            .then(data => {
              console.log('.getdata. получили данные с БД по задаче', data.val());

              // rootState.tasksFB.push(data.val());

              //Пишем нашу задачу в супер JSON

              tasks.push({
                id: taskId,
                taskListId: listId,
                tableId: activeTableId,
                text: data.val().text,
                isDone: data.val().isDone,
                taskListId: data.val().taskListId
              })
              // let bigJSON = rootState.allTasks[rootState.activeTableIndex].taskLists[i].tasks;

              //Если это первая задача - создадим под нее пустой массив
              if (tasks == null) {
                tasks = []
              }

              // rootState.allTasks[rootState.activeTableIndex].taskLists[i].tasks.push(dbTask);
            })
            .catch(error => {
              console.log('Полный провал. Ошибка: ', error);
            })

          rootState.appLog.push(`Зашли в получение задачи с параметрами: Длина массива с задачами ${rootState.masTasks[i].length } Итерация получения задач ${ index } Длинна массива со списками ${ rootState.masTaskLists[ind].length } Итерация получения списков   ${ i }`);
          //Если у нас последняя итерация-отправим массив allTasks на проверку корректности заполнения
          // console.log('habrabra', rootState.allTasks);
          /*Если последняя задача списка и последний список стола
            Вторым условием учтем то, что задач может не быть, а список так же последний, тогда первое условие будет работаь некорректно*/
          if (((rootState.masTasks[i].length - 1) === index && (rootState.masTaskLists[ind].length - 1) === i) || ((rootState.masTasks[i].length == 0) && ((rootState.masTaskLists[ind].length - 1) == i))) {
            //то проверим наш вывод на корректность
            commit('stopTableLoader')
            rootState.appLog.push('Загрузка стола завершена');

            dispatch('verifyTable')

          }

        });


      } else {
        //У списка нет задач
      }
    },

    //Записываем базовые настроки по юзеру
    getSettings({
      rootState
    }, settings) {
      return new Promise((resolve, reject) => {
        let localSettings = settings;

        if (typeof settings == 'undefined') {
          localSettings = {}
        }

        let bgImg = localSettings.bg;
        if (typeof localSettings.bg == 'undefined') {
          bgImg = '/img/bg/stm-bg-2.jpg';
        }

        rootState.currentBgImg = bgImg;
        rootState.activeTableIndex = localSettings.activeTable;

        rootState.appLog.push('getSettings - Получили настройки');
        resolve();
      })


    }

  }
}
