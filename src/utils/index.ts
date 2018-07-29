import { inject } from 'mobx-react';
import { IStore, IStores } from '../store';

export function connect<T>(m: (store: IStore, props: T) => T) {
  return inject<IStores, T, any, T>(({ store }, props) => m(store, props));
}

// const ConnectedSlider = inject<Stores, Props, any, Props>(
//   ({ store }, props) => ({
//     ...props,
//     value: store.Std,
//     onChange: store.setStd,
//   })
// )(VanillaSlider);

export type OnChange<T> = (n: T) => void;

export const changeEventMapper: <T extends HTMLInputElement>(
  o: OnChange<number>
) => React.ChangeEventHandler<T> = onChange => e =>
  onChange(e.target.valueAsNumber);
