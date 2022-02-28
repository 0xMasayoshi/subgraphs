import { Address, BigInt } from '@graphprotocol/graph-ts'
import { assert, clearStore, test } from 'matchstick-as/assembly/index'
import { onIncentiveCreated, onStake, onSubscribe, onUnsubscribe } from '../src/mappings/staking'
import { createIncentiveCreatedEvent, createStakeEvent, createSubscribeEvent, createUnsubscribeEvent } from './mocks'

const ALICE = Address.fromString('0x00000000000000000000000000000000000a71ce')
const BOB = Address.fromString('0x0000000000000000000000000000000000000b0b')
const TOKEN = Address.fromString('0x0000000000000000000000000000000000000001')
const REWARD_TOKEN = Address.fromString('0x0000000000000000000000000000000000000002')
const INCENTIVE_ID = BigInt.fromString('1')
let INITIAL_AMOUNT = BigInt.fromString('1000000')
let startTime = BigInt.fromString('1646068510')
let endTime = BigInt.fromString('1646075000')
let incentiveCreatedEvent = createIncentiveCreatedEvent(
  TOKEN,
  REWARD_TOKEN,
  ALICE,
  INCENTIVE_ID,
  INITIAL_AMOUNT,
  startTime,
  endTime
)



function cleanup(): void {
  clearStore()
}

test('Create incentive', () => {
  onIncentiveCreated(incentiveCreatedEvent)

  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'id', INCENTIVE_ID.toString())
  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'creator', ALICE.toHex())
  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'pool', TOKEN.toHex())
  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'rewardToken', REWARD_TOKEN.toHex())
  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'rewardRemaining', INITIAL_AMOUNT.toString())
  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'endTime', endTime.toString())
  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'rewardPerLiquidity', '1')
  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'lastRewardTime', startTime.toString())
  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'liquidityStaked', '0')

  cleanup()
})

test('subscribe/unsubscribe updates the incentives staked liquidity', () => {
  onIncentiveCreated(incentiveCreatedEvent)
  const amount = BigInt.fromString('10000000')
  let stakeEvent = createStakeEvent(TOKEN, ALICE, amount)
  let subscribeEvent = createSubscribeEvent(INCENTIVE_ID, ALICE)
  let unsubscribeEvent = createUnsubscribeEvent(INCENTIVE_ID, ALICE)

  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'liquidityStaked', '0')

  onStake(stakeEvent)
  // When: subscribe event is triggered
  onSubscribe(subscribeEvent)

  // Then: the incentives staked liquidity is increased
  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'liquidityStaked', amount.toString())

  // And: an unsubscribe decreases liquidity
  onUnsubscribe(unsubscribeEvent)
  assert.fieldEquals('Incentive', INCENTIVE_ID.toString(), 'liquidityStaked', '0')

  cleanup()
})
