import {
  MonoTypeOperatorFunction,
  Observable,
  Operator,
  Subscriber,
  TeardownLogic,
} from 'rxjs';

export type predicateType<T> = (value: T, index: number) => boolean;

class TakeWhileInclusiveSubscriber<T> extends Subscriber<T> {
  private index = 0;

  constructor(
      protected destination: Subscriber<T>,
      private predicate: predicateType<T>,
  ) {
      super(destination);
  }

  protected _next(value: T): void {
      const destination = this.destination;
      let result: boolean;
      try {
          result = this.predicate(value, this.index++);
      } catch (err) {
          destination.error(err);
          return;
      }

      destination.next(value);

      if (!result) {
          destination.complete();
      }
  }
}

class TakeWhileInclusiveOperator<T> implements Operator<T, T> {
  constructor(private predicate: predicateType<T>) {
  }

  call(subscriber: Subscriber<T>, source: any): TeardownLogic {
      return source.subscribe(new TakeWhileInclusiveSubscriber(subscriber, this.predicate));
  }
}

/**
* Emits values emitted by the source Observable so long as each value satisfies
* the given `predicate`, and then completes after the last emitted value
* satisfies the `predicate`.
*
* `takeWhileInclusive` subscribes and begins mirroring the source Observable.
* Each value emitted on the source is emitted then given to the `predicate`
* function which returns a boolean, representing a condition to be satisfied by
* the source values. The output Observable emits the source values until such
* time as the `predicate` returns false, at which point `takeWhileInclusive`
* stops mirroring the source Observable and completes the output Observable.
*
* @param {function(value: T, index: number): boolean} predicate A function that
* evaluates a value emitted by the source Observable and returns a boolean.
* Also takes the (zero-based) index as the second argument.
* @return {Observable<T>} An Observable that emits the values from the source
* Observable and completes after emitting a value that satisfies the condition
* defined by the `predicate`.
* @method takeWhileInclusive
* @owner Observable
*/
export function takeWhileInclusive<T>(predicate: predicateType<T>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => source.lift(new TakeWhileInclusiveOperator(predicate));
}
