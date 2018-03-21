import configureStore from 'redux-mock-store'
import createSagaMiddleware from 'redux-saga'
import { rocketjump } from '../core'
import { takeEveryAndCancel, takeLatestAndCancelGroupBy } from '../effects'

const mockStoreWithSaga = (saga, ...mockStoreArgs) => {
  const sagaMiddleware = createSagaMiddleware()
  const middlewares = [sagaMiddleware]
  const mockStore = configureStore(middlewares)
  const store = mockStore(...mockStoreArgs)
  sagaMiddleware.run(saga)
  return store
}

describe('Rocketjump saga', () => {
  const type = 'GET_SOCI'
  const state = 'soci'
  const mockApiResults = [
    {
      name: 'Gio Va',
      age: 24,
    },
    {
      name: 'Ma Ik',
      age: 29,
    },
  ]

  it('should run an async api and dispatch LOADING and SUCCESS actions when resolved', done => {
    const mockApi = jest.fn().mockResolvedValueOnce(mockApiResults)
    const { actions: { load }, saga } = rocketjump({
      type,
      state,
      api: mockApi,
    })()
    const store = mockStoreWithSaga(saga, {})
    store.dispatch(load())
    mockApi.mock.returnValues[0].then(() => {
      expect(store.getActions()).toEqual([
        {
          type,
          payload: { params: {} },
          meta: {},
        },
        {
          type: `${type}_LOADING`,
          meta: {},
        },
        {
          type: `${type}_SUCCESS`,
          meta: {},
          payload: {
            params: {},
            data: mockApiResults,
          },
        },
      ])
      done()
    })
  })

  it('should run an async api and dispatch LOADING and FAILURE actions when rejected', done => {
    const mockBadApi = jest.fn(
      () =>
        new Promise((_, reject) => {
          reject('Bad shit')
        })
    )
    const { actions: { load }, saga } = rocketjump({
      type,
      state,
      api: mockBadApi,
    })()
    const store = mockStoreWithSaga(saga, {})
    store.dispatch(load())
    mockBadApi.mock.returnValues[0].catch(() => {
      expect(store.getActions()).toEqual([
        {
          type,
          payload: { params: {} },
          meta: {},
        },
        {
          type: `${type}_LOADING`,
          meta: {},
        },
        {
          type: `${type}_FAILURE`,
          meta: {},
          error: 'Bad shit',
        },
      ])
      done()
    })
  })

  it('should pass params to api function', () => {
    const mockApi = jest.fn()
    const { actions: { load }, saga } = rocketjump({
      type,
      state,
      api: mockApi,
    })()
    const store = mockStoreWithSaga(saga, {})
    store.dispatch(load({ giova: 666, rinne: 22 }))
    expect(mockApi.mock.calls[0][0]).toEqual({ giova: 666, rinne: 22 })
  })

  it('should dispatch meta along with actions', done => {
    const mockApi = jest.fn().mockResolvedValueOnce(mockApiResults)
    const { actions: { load }, saga } = rocketjump({
      type,
      state,
      api: mockApi,
    })()
    const store = mockStoreWithSaga(saga, {})
    store.dispatch(load(undefined, { maik: 23 }))
    mockApi.mock.returnValues[0].then(() => {
      expect(store.getActions()).toEqual([
        {
          type,
          payload: { params: {} },
          meta: { maik: 23 },
        },
        {
          type: `${type}_LOADING`,
          meta: { maik: 23 },
        },
        {
          type: `${type}_SUCCESS`,
          meta: { maik: 23 },
          payload: {
            params: {},
            data: mockApiResults,
          },
        },
      ])
      done()
    })
  })

  it('should dispatch meta along with actions also when reject', done => {
    const mockBadApi = jest.fn(
      () =>
        new Promise((_, reject) => {
          reject('Bad shit')
        })
    )
    const { actions: { load }, saga } = rocketjump({
      type,
      state,
      api: mockBadApi,
    })()
    const store = mockStoreWithSaga(saga, {})
    store.dispatch(load(undefined, { maik: 23 }))
    mockBadApi.mock.returnValues[0].catch(() => {
      expect(store.getActions()).toEqual([
        {
          type,
          payload: { params: {} },
          meta: { maik: 23 },
        },
        {
          type: `${type}_LOADING`,
          meta: { maik: 23 },
        },
        {
          type: `${type}_FAILURE`,
          meta: { maik: 23 },
          error: 'Bad shit',
        },
      ])
      done()
    })
  })

  it('can unload a side effect', done => {
    const mockApi = jest.fn().mockResolvedValueOnce(mockApiResults)
    const { actions: { load, unload }, saga } = rocketjump({
      type,
      state,
      api: mockApi,
    })()
    const store = mockStoreWithSaga(saga, {})
    store.dispatch(load())
    store.dispatch(unload())
    mockApi.mock.returnValues[0].then(() => {
      expect(store.getActions()).toEqual([
        {
          type,
          payload: { params: {} },
          meta: {},
        },
        {
          type: `${type}_LOADING`,
          meta: {},
        },
        {
          type: `${type}_UNLOAD`,
          meta: {},
        },
      ])
      done()
    })
  })

  it('take only the last side effect as default', done => {
    const mockApi = jest
      .fn()
      .mockResolvedValueOnce('bananasplit')
      .mockResolvedValueOnce('splitbanana')
    const { actions: { load }, saga } = rocketjump({
      type,
      state,
      api: mockApi,
    })()
    const store = mockStoreWithSaga(saga, {})
    store.dispatch(load())
    store.dispatch(load())
    mockApi.mock.returnValues[1].then(() => {
      expect(store.getActions()).toEqual([
        {
          type,
          payload: { params: {} },
          meta: {},
        },
        {
          type: `${type}_LOADING`,
          meta: {},
        },
        {
          type,
          payload: { params: {} },
          meta: {},
        },
        {
          type: `${type}_LOADING`,
          meta: {},
        },
        {
          type: `${type}_SUCCESS`,
          meta: {},
          payload: {
            params: {},
            data: 'splitbanana',
          },
        },
      ])
      done()
    })
  })

  it('take every side effect when specified', done => {
    const mockApi = jest
      .fn()
      .mockResolvedValueOnce('bananasplit')
      .mockResolvedValueOnce('splitbanana')
    const { actions: { load }, saga } = rocketjump({
      type,
      state,
      api: mockApi,
      takeEffect: takeEveryAndCancel,
    })()
    const store = mockStoreWithSaga(saga, {})
    store.dispatch(load())
    store.dispatch(load())
    mockApi.mock.returnValues[1].then(r => {
      expect(store.getActions()).toEqual([
        {
          type,
          payload: { params: {} },
          meta: {},
        },
        {
          type: `${type}_LOADING`,
          meta: {},
        },
        {
          type,
          payload: { params: {} },
          meta: {},
        },
        {
          type: `${type}_LOADING`,
          meta: {},
        },
        {
          type: `${type}_SUCCESS`,
          payload: {
            params: {},
            data: 'bananasplit',
          },
          meta: {},
        },
        {
          type: `${type}_SUCCESS`,
          meta: {},
          payload: {
            params: {},
            data: 'splitbanana',
          },
        },
      ])
      done()
    })
  })

  it('take latest side effect group by when specified', done => {
    const counterByName = {}
    const mockApi = jest.fn(
      ({ name }) =>
        new Promise(resolve => {
          counterByName[name] = (counterByName[name] || 0) + 1
          resolve(`${name} is cool ${counterByName[name]}`)
        })
    )
    const { actions: { load }, saga } = rocketjump({
      type,
      state,
      api: mockApi,
      takeEffect: takeLatestAndCancelGroupBy,
      takeEffectArgs: [({ meta }) => meta.name],
      proxyActions: {
        load: ({ load }) => name => load({ name }, { name }),
      },
    })()
    const store = mockStoreWithSaga(saga, {})
    store.dispatch(load('maik'))
    store.dispatch(load('giova'))
    store.dispatch(load('maik'))
    store.dispatch(load('lore'))

    mockApi.mock.returnValues[3].then(r => {
      expect(store.getActions()).toEqual([
        {
          type,
          payload: { params: { name: 'maik' } },
          meta: { name: 'maik' },
        },
        {
          type: `${type}_LOADING`,
          meta: { name: 'maik' },
        },
        {
          type,
          payload: { params: { name: 'giova' } },
          meta: { name: 'giova' },
        },
        {
          type: `${type}_LOADING`,
          meta: { name: 'giova' },
        },
        {
          type,
          payload: { params: { name: 'maik' } },
          meta: { name: 'maik' },
        },
        {
          type: `${type}_LOADING`,
          meta: { name: 'maik' },
        },
        {
          type,
          payload: { params: { name: 'lore' } },
          meta: { name: 'lore' },
        },
        {
          type: `${type}_LOADING`,
          meta: { name: 'lore' },
        },
        {
          type: `${type}_SUCCESS`,
          payload: {
            params: { name: 'giova' },
            data: 'giova is cool 1',
          },
          meta: { name: 'giova' },
        },
        {
          type: `${type}_SUCCESS`,
          payload: {
            params: { name: 'maik' },
            data: 'maik is cool 2',
          },
          meta: { name: 'maik' },
        },
        {
          type: `${type}_SUCCESS`,
          payload: {
            params: { name: 'lore' },
            data: 'lore is cool 1',
          },
          meta: { name: 'lore' },
        },
      ])
      done()
    })
  })

  it('can be custom!', () => {
    expect.assertions(2)

    function api() {}
    function apiExtraParams() {}
    function takeEffect() {}
    function takeEffectArgs() {}
    function callApi() {}
    function successEffect() {}
    function failureEffect() {}

    function* customSaga() {}

    function makeCustomSaga(config) {
      expect(config).toEqual({
        type,
        state,
        api,
        apiExtraParams,
        takeEffect,
        takeEffectArgs,
        callApi,
        successEffect,
        failureEffect,
      })
      return customSaga
    }

    const { saga } = rocketjump({
      type,
      state,
      saga: makeCustomSaga,
      api,
      apiExtraParams,
      takeEffect,
      takeEffectArgs,
      callApi,
      successEffect,
      failureEffect,
    })()
    expect(saga).toBe(customSaga)
  })
})
