import { inject } from 'mobx-react';
import { IJsonPatch, IMiddlewareEvent, IPatchRecorder } from 'mobx-state-tree';
import short from 'short-uuid';
import { Entry } from '../patch-manager';
import { IStore, IStores } from '../store';

export function connect<T>(m: (store: IStore, props: T) => T) {
  return inject<IStores, T, any, T>(({ store }, props) => m(store, props));
}

export type OnChange<T> = (n: T) => void;

export const changeEventMapper: <T extends HTMLInputElement>(
  o: OnChange<number>
) => React.ChangeEventHandler<T> = onChange => e =>
  onChange(e.target.valueAsNumber);

export function logPatch({ path, value, op }: IJsonPatch) {
  console.log(op, path, value);
}

export function logAction(recorder: IPatchRecorder, event: IMiddlewareEvent) {
  const { name, id } = event;
  console.log(id, name);
  recorder.patches.forEach(p => logPatch(p));
}

export function logEntry({ action, patches }: Entry) {
  const { name } = action;
  console.log(name);
  patches.forEach(p => logPatch(p));
}

const uuidGenerator = short(short.constants.flickrBase58);

export function uuid() {
  return uuidGenerator.new();
}
