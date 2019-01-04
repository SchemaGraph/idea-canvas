import * as React from 'react';
import styled from 'styled-components';
import {
  H5,
  FormGroup,
  InputGroup,
  Button,
  MenuItem,
  Label,
  Icon,
  ButtonGroup,
  Divider,
  Switch,
} from '@blueprintjs/core';
import { Select, ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import { observer } from 'mobx-react-lite';
import { IStore, mainId } from '../../models/store';
import { IBox, IContext, IContexts } from '../../models/models';
import { ContextIcon } from '../context-list';
import { colors } from '../../theme/theme';
import { connect, useConditionalEffect } from '../../utils';
import { FunctionComponent, useRef, useCallback } from 'react';

const ContextSelect = Select.ofType<undefined | IContext>();
const Container = styled.div``;
interface P {
  id: string;
  store?: IStore;
}

const filterContext: ItemPredicate<IContext> = (query, context) => {
  return context.name.toLowerCase().indexOf(query.toLowerCase()) >= 0;
};

const renderContext: ItemRenderer<IContext | undefined> = (
  context,
  { handleClick, modifiers }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return !context ? (
    <MenuItem
      icon={<ContextIcon />}
      active={false}
      key="empty"
      onClick={handleClick}
      text={'NONE'}
    />
  ) : (
    <MenuItem
      icon={<ContextIcon context={context} />}
      active={false}
      key={context.name}
      onClick={handleClick}
      text={context.name}
    />
  );
};

const PropertiesBase: FunctionComponent<P> = ({ store, id: originalId }) => {
  if (!store) {
    return null;
  }
  const {
    newContextInput,
    newContextInputValue,
    addContext,
    setContextInputValue,
    toggleContextInput,
    graph,
    focus,
    setFocus,
  } = store;

  const id = mainId(originalId);
  const newContext = {
    show: newContextInput,
    setInputValue: setContextInputValue,
    inputValue: newContextInputValue,
    add: addContext,
    toggle: toggleContextInput,
  };

  const { contexts } = graph;
  const box = graph.boxes.get(id);
  if (!box) {
    return null;
  }
  const contextInputRef = useRef<HTMLInputElement>(null);

  useConditionalEffect(
    i => {
      i.focus();
    },
    [() => contextInputRef.current, newContext.show],
    [newContext.show]
  );

  const { context, name, setName } = box;
  const labelHandler: React.ChangeEventHandler<HTMLInputElement> = e => {
    setName(e.currentTarget.value);
  };
  const contextKeyUpHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && validContext()) {
      submitContext();
    }
    if (e.key === 'Escape') {
      discardContext();
    }
  };

  const validContext = () =>
    newContext.inputValue && newContext.inputValue.length > 0;

  const submitContext = () => {
    newContext.add(newContext.inputValue, undefined, box);
    discardContext();
  };

  const discardContext = () => {
    newContext.setInputValue('');
    newContext.toggle();
  };

  const contextChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    newContext.setInputValue(e.currentTarget.value);
  };

  const contextInputButtons = (
    <ButtonGroup minimal large>
      <Button
        icon={<Icon icon="tick" color={colors.white.string()} />}
        onClick={submitContext}
        disabled={!validContext()}
      />
      <Button
        icon={<Icon icon="cross" color={colors.white.string()} />}
        color="red"
        onClick={discardContext}
      />
    </ButtonGroup>
  );

  const focusViewHandler = useCallback(
    () => {
      setFocus(focus === id ? null : id);
    },
    [setFocus, focus, id]
  );

  const items = [undefined as IContext | undefined].concat(
    Array.from(contexts.values())
  );
  return (
    <>
      <FormGroup label="Label" labelFor="box-label">
        <InputGroup
          id="box-label"
          value={box.name}
          onChange={labelHandler}
          large
        />
      </FormGroup>
      <FormGroup label="Context" labelFor="context">
        <ContextSelect
          itemRenderer={renderContext}
          onItemSelect={box.setContext}
          items={items}
          filterable={false}
        >
          <Button
            text={context ? context.name : 'NONE'}
            rightIcon="double-caret-vertical"
            alignText="left"
            icon={context ? <ContextIcon context={context} /> : undefined}
            fill={true}
            large
          />
        </ContextSelect>
        <div style={{ marginTop: '5px' }}>
          {newContext.show ? (
            <InputGroup
              value={newContext.inputValue}
              onChange={contextChangeHandler}
              onKeyUp={contextKeyUpHandler}
              leftIcon="plus"
              rightElement={contextInputButtons}
              inputRef={contextInputRef as any}
              large
            />
          ) : (
            <Button
              rightIcon="plus"
              minimal
              onClick={newContext.toggle}
              large
            />
          )}
        </div>
      </FormGroup>
      <Switch
        checked={focus === id}
        onChange={focusViewHandler}
        label="Focus"
      />
    </>
  );
};

export const Properties = connect<P>((store, props) => ({
  ...props,
  store,
}))(observer(PropertiesBase));
