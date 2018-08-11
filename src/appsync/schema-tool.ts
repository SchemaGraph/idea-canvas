// tslint:disable:no-implicit-dependencies
import { AppSync } from 'aws-sdk';
import chalk from 'chalk';
import * as fs from 'fs';
import { from, timer } from 'rxjs';
import { takeWhileInclusive } from 'rxjs-take-while-inclusive';
import { map, mergeMap, tap, toArray } from 'rxjs/operators';
import { promisify } from 'util';
import yargs from 'yargs';
const readFile = promisify(fs.readFile);

async function main() {
  try {
    const args = yargs
      .usage('Usage: $0 <command>')
      .command('resolvers', 'Update the resolvers')
      .command('schema', 'Update the schema')
      .command('all', 'Update the whole shebang')
      .help().argv;
    const cmd = args._ && args._[0];
    switch (cmd) {
      case 'resolvers':
        await mainUpdateResolvers();
        break;
      case 'schema':
        await mainUpdateSchema();
        break;
      case 'all':
        await mainUpdateSchema();
        await mainUpdateResolvers();
        break;
    }
  } catch (error) {
    console.log(error);
  }
}
main();

async function mainUpdateResolvers() {
  console.log(chalk.bold('Updating resolvers...'));
  const options = getAwsOptions();
  const client = new AppSync(options);
  const results = await updateResolvers(
    await getResolvers(options.apiId),
    client
  );
  console.log(chalk.green('successfully updated %d resolvers'), results.length);
}

async function mainUpdateSchema() {
  console.log(chalk.bold('Updating schema...'));
  const options = getAwsOptions();
  const client = new AppSync(options);
  const schema = await readSchema();
  const result = await updateSchema(schema, options.apiId, client);
  if (result.status === 'SUCCESS') {
    console.log(chalk.green('schema creation complete'));
  } else {
    console.log(chalk.red('schema creation failed\n'));
    throw new Error(result.details);
  }
}

function readTemplate(template: string, suffix = 'vtl') {
  return readFile(`${__dirname}/../gql/resolvers/${template}.${suffix}`, {
    encoding: 'utf8',
  });
}
function readSchema() {
  return readFile(`${__dirname}/../gql/schema.graphql`, {
    encoding: 'utf8',
  });
}

type Resolver = AppSync.Types.UpdateResolverRequest;
type CreateResolver = AppSync.Types.CreateResolverRequest;

function templateGetItem(idArg = 'id') {
  return `
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.${idArg}),
  },
}
`;
}

async function getResolvers(APPSYNC_API_ID: string): Promise<Resolver[]> {
  return [
    {
      apiId: APPSYNC_API_ID,
      typeName: 'Mutation',
      fieldName: 'addPatches',
      dataSourceName: 'IdeaCanvas_PatchTable',
      requestMappingTemplate: await readTemplate('MutationAddPatchesRequest'),
      responseMappingTemplate: await readTemplate('MutationAddPatchesResponse'),
    },
    {
      apiId: APPSYNC_API_ID,
      typeName: 'Graph',
      fieldName: 'patches',
      dataSourceName: 'IdeaCanvas_PatchTable',
      requestMappingTemplate: await readTemplate('GraphPatchesRequest'),
      responseMappingTemplate: await readTemplate('GraphPatchesResponse'),
    },
    {
      apiId: APPSYNC_API_ID,
      typeName: 'Mutation',
      fieldName: 'createGraph',
      dataSourceName: 'IdeaCanvas_GraphTable',
      requestMappingTemplate: await readTemplate('MutationCreateGraphRequest'),
      responseMappingTemplate: `$util.toJson($context.result)`,
    },
    {
      apiId: APPSYNC_API_ID,
      typeName: 'Mutation',
      fieldName: 'createPatch',
      dataSourceName: 'IdeaCanvas_PatchTable',
      requestMappingTemplate: await readTemplate('MutationCreatePatchRequest'),
      responseMappingTemplate: `$util.toJson($context.result)`,
    },
    {
      apiId: APPSYNC_API_ID,
      typeName: 'Query',
      fieldName: 'getGraph',
      dataSourceName: 'IdeaCanvas_GraphTable',
      requestMappingTemplate: templateGetItem(),
      responseMappingTemplate: `$util.toJson($context.result)`,
    },
    {
      apiId: APPSYNC_API_ID,
      typeName: 'Query',
      fieldName: 'getPatches',
      dataSourceName: 'IdeaCanvas_PatchTable',
      requestMappingTemplate: await readTemplate('QueryGetPatchesRequest'),
      responseMappingTemplate: `$util.toJson($context.result.items)`,
    },
  ];
}

function updateResolvers(resolvers: Resolver[], client: AppSync) {
  return from(resolvers)
    .pipe(
      mergeMap(async x => {
        // console.log(`INFLIGHT ${x.typeName}.${x.fieldName}`);
        try {
          return await client.updateResolver(x).promise();
        } catch (error) {
          if (error.statusCode === 404) {
            return client.createResolver(x).promise();
          } else {
            throw error;
          }
        }
      }, 2),
      map(x => x.resolver!),
      toArray()
    )
    .toPromise();
}

function updateSchema(schema: string, apiId: string, client: AppSync) {
  return from(
    client
      .startSchemaCreation({
        apiId,
        definition: schema,
      })
      .promise()
  )
    .pipe(
      mergeMap(_ => {
        // console.log(`SCHEMA creation started`);
        return timer(100, 400).pipe(
          mergeMap(
            __ =>
              client
                .getSchemaCreationStatus({
                  apiId,
                })
                .promise(),
            1
          )
        );
      }, 1),
      tap(x => console.log(x.status)),
      takeWhileInclusive(x => x.status === 'PROCESSING')
    )
    .toPromise();
}

interface AwsOptions {
  apiId: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

function getAwsOptions(provided: Partial<AwsOptions> = {}) {
  const {
    APPSYNC_API_ID,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
  } = process.env;
  const options = {
    apiId: provided.apiId || APPSYNC_API_ID,
    accessKeyId: provided.accessKeyId || AWS_ACCESS_KEY_ID,
    secretAccessKey: provided.secretAccessKey || AWS_SECRET_ACCESS_KEY,
    region: provided.region || AWS_REGION || 'eu-west-1',
  };
  for (const k in options) {
    if (!options[k as keyof AwsOptions]) {
      throw new Error(`${k} is not defined`);
    }
  }
  return options as AwsOptions;
}
