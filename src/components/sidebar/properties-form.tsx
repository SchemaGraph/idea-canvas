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
} from '@blueprintjs/core';
import { Select, ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import { observer } from 'mobx-react';
import { IStore } from '../../models/store';
import { IBox, IContext, IContexts } from '../../models/models';
import { ContextIcon } from '../context-list';
import { colors } from '../../theme/theme';
import { connect } from '../../utils';

const ContextSelect = Select.ofType<undefined | IContext>();
const Container = styled.div``;
interface P {
  id?: string;
  store?: IStore;
}

interface BoxProps {
  box: IBox;
  contexts: IContexts;
  newContext: {
    show: boolean;
    setInputValue: (v: string) => void;
    inputValue: string;
    add: (name: string, color?: string, box?: IBox) => IContext | undefined;
    toggle: () => void;
  };
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

class BoxBase extends React.Component<BoxProps> {
  private contextInputRef = React.createRef<HTMLInputElement>();

  componentDidUpdate(prevProps: BoxProps) {
    if (
      this.props.newContext.show &&
      !prevProps.newContext.show &&
      this.contextInputRef.current
    ) {
      this.contextInputRef.current.focus();
    }
  }

  render() {
    const { box, contexts, newContext } = this.props;
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
                inputRef={this.contextInputRef as any}
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
      </>
    );
  }
}
const Box = observer(BoxBase);
class PropertiesBase extends React.Component<P> {
  public render() {
    const {
      newContextInput,
      newContextInputValue,
      addContext,
      setContextInputValue,
      toggleContextInput,
    } = this.props.store!;
    const { boxes, arrows, contexts } = this.props.store!.graph;
    let content: React.ReactNode;
    const id = this.props.id;
    if (id) {
      if (boxes.has(id)) {
        content = (
          <Box
            box={boxes.get(id)!}
            contexts={contexts}
            newContext={{
              show: newContextInput,
              setInputValue: setContextInputValue,
              inputValue: newContextInputValue,
              add: addContext,
              toggle: toggleContextInput,
            }}
          />
        );
      }
    }
    return <Container>{content}</Container>;
  }
}

export const Properties = connect<P>((store, _) => ({
  store,
}))(observer(PropertiesBase));
