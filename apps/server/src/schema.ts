import SchemaBuilder from '@pothos/core';
import { User } from './data';

export const builder = new SchemaBuilder({});
builder.objectType(User, {
  name: 'User',
  fields: t => ({
    id: t.exposeID('id'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    fullName: t.string({
      resolve: user => `${user.firstName} ${user.lastName}`,
    }),
  }),
});

builder.queryType({
  fields: t => ({
    user: t.field({
      type: User,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: (_root, args) => new User(args.id),
    }),
  }),
});

export const schema = builder.toSchema();
