// import configureStore from 'redux-mock-store'
// import createSagaMiddleware from 'redux-saga'
import { rj } from '../rocketjump'
// import { takeEveryAndCancel } from '../effects'
import combineRjs from '../catalogs/combine'
import rjList, { nextPreviousPaginationAdapter } from '../catalogs/list'
// import rjMap from '../catalogs/map'
import rjUpdate from '../catalogs/update'
import rjDelete from '../catalogs/delete'
import { makeUpdateReducer, makeRemoveListReducer } from '../catalogs/hor'

// const mockStoreWithSaga = (saga, ...mockStoreArgs) => {
//   const sagaMiddleware = createSagaMiddleware()
//   const middlewares = [sagaMiddleware]
//   const mockStore = configureStore(middlewares)
//   const store = mockStore(...mockStoreArgs)
//   sagaMiddleware.run(saga)
//   return store
// }

describe('Combine catalog', () => {
  it('Should combine reducers', () => {

    // MOCKS
    const BROS = [
      {
        id: 23,
        starred: true,
        name: 'Gio Va',
      },
      {
        id: 777,
        starred: false,
        name: 'TONY EFFE',
      }
    ]

    // SIDE EFFECTS
    const GET_BROS = 'GET_BROS'
    const SET_BRO_STARRED = 'SET_BRO_STARRED'
    const DELETE_BRO = 'DELETE_BRO'
    const UPDATE_BRO = 'UPDATE_BRO'

    // Base rjs
    const rjBaseList = rjList({
      pagination: nextPreviousPaginationAdapter,
      pageSize: 20,
    })

    const { reducer } = combineRjs({

      list: rj(rjBaseList, {
        type: GET_BROS,
        composeReducer: [
          makeUpdateReducer(
            SET_BRO_STARRED,
            'data.list',
            undefined,
            ({ payload: { data: { starred } } }, obj) => ({ ...obj, starred }),
          ),
          makeRemoveListReducer(DELETE_BRO),
          makeUpdateReducer(UPDATE_BRO, 'data.list'),
        ],
        api: () => BROS,
      }),

      starring: rj(rjUpdate(), {
        proxyActions: {
          load: ({ load }) => (id, starred) =>
            load({ id, starred }, { id }),
        },
        type: SET_BRO_STARRED,
        // Return new "starred" state
        api: ({ id, starred }) => ({ id, starred }),
      }),

      deleting: rj(rjDelete(), {
        type: DELETE_BRO,
        // Such as 204 No Content
        api: () => null,
      }),

      updating: rj(rjUpdate(), {
        type: UPDATE_BRO,
        // Such as 204 No Content
        api: () => null,
      })

    }, { state: 'bros' })

    // INIT THE STATE
    let state = reducer(undefined, {})
    expect(state).toEqual({
      list: {
        loading: false,
        error: null,
        data: null,
      },
      starring: {},
      deleting: {},
      updating: {},
    })

    // LOAD BROS
    state = reducer(state, {
      type: 'GET_BROS_SUCCESS',
      payload: {
        params: {},
        data: {
          next: null,
          previous: null,
          count: 2,
          results: BROS,
        }
      }
    })
    expect(state).toEqual({
      list: {
        loading: false,
        error: null,
        data: {
          list: [
            {
              id: 23,
              starred: true,
              name: 'Gio Va',
            },
            {
              id: 777,
              starred: false,
              name: 'TONY EFFE',
            }
          ],
          pagination: {
            current: { page: 1 },
            count: 2,
            next: null,
            previous: null,
          }
        }
      },
      starring: {},
      deleting: {},
      updating: {},
    })

    // UNSTAR A BRO
    state = reducer(state, {
      type: 'SET_BRO_STARRED_SUCCESS',
      payload: {
        data: {
          id: 23,
          starred: false,
        }
      },
      meta: { id: 23 }
    })
    expect(state).toEqual({
      list: {
        loading: false,
        error: null,
        data: {
          list: [
            {
              id: 23,
              starred: false,
              name: 'Gio Va',
            },
            {
              id: 777,
              starred: false,
              name: 'TONY EFFE',
            }
          ],
          pagination: {
            current: { page: 1 },
            count: 2,
            next: null,
            previous: null,
          }
        }
      },
      starring: {},
      deleting: {},
      updating: {},
    })

    // DELETE A BRO
    state = reducer(state, {
      type: 'DELETE_BRO_SUCCESS',
      payload: {
        data: {
          id: 777,
        }
      },
      meta: { id: 777 }
    })
    expect(state).toEqual({
      list: {
        loading: false,
        error: null,
        data: {
          list: [
            {
              id: 23,
              starred: false,
              name: 'Gio Va',
            },
          ],
          pagination: {
            current: { page: 1 },
            count: 1,
            next: null,
            previous: null,
          }
        }
      },
      starring: {},
      deleting: {},
      updating: {},
    })

    // UPDATE A BRO
    state = reducer(state, {
      type: 'UPDATE_BRO_SUCCESS',
      payload: {
        data: {
          name: '@theRealGiova',
          starred: false,
          id: 23
        }
      },
      meta: { id: 23 }
    })
    expect(state).toEqual({
      list: {
        loading: false,
        error: null,
        data: {
          list: [
            {
              id: 23,
              starred: false,
              name: '@theRealGiova',
            },
          ],
          pagination: {
            current: { page: 1 },
            count: 1,
            next: null,
            previous: null,
          }
        }
      },
      starring: {},
      deleting: {},
      updating: {},
    })
    // console.log(JSON.stringify(state, null, 2))

  })
})
