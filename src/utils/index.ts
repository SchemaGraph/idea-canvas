import { inject } from 'mobx-react';
import { IJsonPatch, IMiddlewareEvent, IPatchRecorder } from 'mobx-state-tree';
import short from 'short-uuid';
import { IStore, IStores } from '../models/store';
import { Entry } from '../models/undo-manager';
import { useEffect, EffectCallback, InputIdentityList } from 'react';

export function connect<T>(m: (store: IStore, props: T) => T) {
  return inject<IStores, T, any, T>(({ store }, props) => m(store, props));
}

export type OnChange<T> = (n: T) => void;

// export const changeEventMapper: <T extends HTMLInputElement>(
//   o: OnChange<number>
// ) => React.ChangeEventHandler<T> = onChange => e =>
//   onChange(e.target.valueAsNumber);

export function logPatch({ path, value, op }: IJsonPatch) {
  console.log(op, path, value);
}

export function logAction(recorder: IPatchRecorder, event: IMiddlewareEvent) {
  const { name, id } = event;
  console.log(id, name);
  recorder.patches.forEach(p => logPatch(p));
}

export function logEntry({ action, patches }: Entry) {
  console.log(action);
  patches.forEach(p => logPatch(p));
}

const uuidGenerator = short(short.constants.flickrBase58);

export function uuid() {
  return uuidGenerator.new();
}


function checkArgs<T extends any[]>(args: T): args is RequiredAndNonNull<T> {
  for (const v of args) {
    if (v === null || v === undefined) {
      return false;
    }
  }
  return true;
}

type RequiredAndNonNull<T> = {
  [P in keyof T]: Exclude<T[P], null | undefined>
};

// https://github.com/Microsoft/TypeScript/issues/27179#issuecomment-422606990
export function useConditionalEffect<T>(
  effectA: (a: NonNullable<T>) => void | (() => void),
  args: [T],
  inputs?: InputIdentityList,
  effectB?: EffectCallback
): void;
export function useConditionalEffect<T, S>(
  effectA: (a: NonNullable<T>, b: NonNullable<S>) => void | (() => void),
  args: [T, S],
  inputs?: InputIdentityList,
  effectB?: EffectCallback
): void;
export function useConditionalEffect<T, S, V>(
  effectA: (a: NonNullable<T>, b: NonNullable<S>, c: NonNullable<V>) => void | (() => void),
  args: [T, S, V],
  inputs?: InputIdentityList,
  effectB?: EffectCallback
): void;

export function useConditionalEffect(
  effectA: (...args: any[]) => void | (() => void),
  args: any[],
  inputs?: InputIdentityList,
  effectB?: EffectCallback
) {
  useEffect(() => {
    if (checkArgs(args)) {
      return effectA(...args);
    } else if (effectB) {
      return effectB();
    }
  }, inputs);
}

export function tuple<T extends any[]>(...elements: T) {
  return elements;
}
