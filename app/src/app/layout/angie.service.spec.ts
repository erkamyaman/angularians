import { TestBed } from '@angular/core/testing'
import { ANGIE_MET_KEY, ANGIE_OFF_KEY, AngieService } from './angie.service'

describe('AngieService', () => {
  beforeEach(() => {
    localStorage.clear()
    TestBed.resetTestingModule()
  })

  it('is on by default', () => {
    expect(TestBed.inject(AngieService).on()).toBe(true)
  })

  it('turns off and on, remembering only off', () => {
    const angie = TestBed.inject(AngieService)
    angie.toggle()
    expect(angie.on()).toBe(false)
    expect(localStorage.getItem(ANGIE_OFF_KEY)).toBe('1')
    angie.toggle()
    expect(angie.on()).toBe(true)
    expect(localStorage.getItem(ANGIE_OFF_KEY)).toBeNull()
  })

  it('stays off on the next visit', () => {
    localStorage.setItem(ANGIE_OFF_KEY, '1')
    expect(TestBed.inject(AngieService).on()).toBe(false)
  })

  it('introduces her once, after the first storm', () => {
    const angie = TestBed.inject(AngieService)
    expect(angie.introOpen()).toBe(false)
    angie.stormEnded()
    expect(angie.introOpen()).toBe(true)
    expect(localStorage.getItem(ANGIE_MET_KEY)).toBe('1')
    angie.closeIntro()
    angie.stormEnded()
    expect(angie.introOpen()).toBe(false)
  })

  it('does not introduce her on a later visit', () => {
    localStorage.setItem(ANGIE_MET_KEY, '1')
    const angie = TestBed.inject(AngieService)
    angie.stormEnded()
    expect(angie.introOpen()).toBe(false)
  })

  it('does not introduce her once she is off', () => {
    const angie = TestBed.inject(AngieService)
    angie.toggle()
    angie.stormEnded()
    expect(angie.introOpen()).toBe(false)
  })
})
