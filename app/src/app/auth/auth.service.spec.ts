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
