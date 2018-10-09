import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { connect } from '../utils';
import { IContexts, IContext } from './models';
import { values } from 'mobx';

const Container = styled.div`
  position: absolute;
  right: 0px;
  bottom: 0px;
  background-color: rgba(0, 0, 0, 0.2);
`;
interface Props {
  contexts?: IContexts;
}
interface ItemProps {
  context: IContext;
}

const ContextListItem = styled.div<ItemProps>`
  background-color: ${({context}) => context.color};
  padding: 8px;
  margin-bottom: 4px;
  width: 80px;
`;

const ContextListVanilla: React.SFC<Props> = ({ contexts }) => {
  console.log(contexts);
  return (
    <Container>
      {values(contexts).map((context: IContext) => {
        console.log(context);
        return (
          <ContextListItem context={context} key={context.name}>
            {context.name}
          </ContextListItem>
        );
      })}
    </Container>
  );
};

export const ContextList = connect<Props>(store => ({
  contexts: store.contexts as any,
}))(observer(ContextListVanilla));
