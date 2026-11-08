import { makeStateKey, PLATFORM_ID, TransferState } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { AuthService, SIGN_IN_SET_UP } from './auth.service'

const SIGN_IN_OFF = makeStateKey<boolean>('sign-in-off')

describe('AuthService on a site without sign-in', () => {
  it('starts as sign-in off on the server, and tells the browser', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }, { provide: SIGN_IN_SET_UP, useValue: false }] })
    expect(TestBed.inject(AuthService).state()).toEqual({ enabled: false, user: null })
    expect(TestBed.inject(TransferState).get(SIGN_IN_OFF, false)).toBe(true)
  })

  it('stays unknown on the server when sign-in is set up', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }, { provide: SIGN_IN_SET_UP, useValue: true }] })
    expect(TestBed.inject(AuthService).state()).toBeNull()
  })

  it('starts as sign-in off in the browser too, without asking the session', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'browser' }] })
    TestBed.inject(TransferState).set(SIGN_IN_OFF, true)
    expect(TestBed.inject(AuthService).state()).toEqual({ enabled: false, user: null })
    expect(fetch).not.toHaveBeenCalled()
    fetch.mockRestore()
  })
})

describe('AuthService in the browser', () => {
  afterEach(() => {
    document.cookie = 'angularians-signed-in=; max-age=0; path=/'
    vi.restoreAllMocks()
  })

  function start() {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'browser' }] })
    return TestBed.inject(AuthService)
  }

  it('does not call the server for a visitor who was not signed in', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    const auth = start()
    TestBed.tick()
    expect(fetch).not.toHaveBeenCalled()
    expect(auth.state()).toEqual({ enabled: true, user: null })
  })

  it('asks the server when the browser was signed in', async () => {
    document.cookie = 'angularians-signed-in=1; path=/'
    const user = { githubId: 1, login: 'someone', angularian: null, badges: [] }
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ enabled: true, user })))
    const auth = start()
    expect(fetch).toHaveBeenCalledWith('/api/auth/me', expect.anything())
    await vi.waitFor(() => expect(auth.state()?.user).toEqual(user))
  })
})
