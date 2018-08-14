// tslint:disable:no-implicit-dependencies
import { DynamoDB } from 'aws-sdk';
import { QueryInput } from 'aws-sdk/clients/dynamodb';
import chalk from 'chalk';
import yargs from 'yargs';
const GRAPH_TABLE = 'IdeaCanvas_GraphTable';
const PATCH_TABLE = 'PatchTable';

const keys = {
  [GRAPH_TABLE]: ['id'],
  [PATCH_TABLE]: ['graphId', 'seq'],
};

async function main() {
  try {
    const args = yargs
      .usage('Usage: $0 <command>')
      .command('list-graphs', 'List graph-ids')
      .command('truncate <table>', 'List graph-ids')
      .help().argv;
    const cmd = args._ && args._[0];
    switch (cmd) {
      case 'list-graphs':
        await mainListGraphs();
        break;
      case 'truncate':
        await mainTruncate(args.table);
        break;
      default:
        console.log(chalk.red('Unknown command'));
    }
  } catch (error) {
    console.log(error);
  }
}
main();

async function mainListGraphs() {
  const options = getAwsOptions();
  const client = new DynamoDB(options);
  const results = await listGraphs(client);
  console.log(results);
}

async function mainTruncate(table: string) {
  const options = getAwsOptions();
  const client = new DynamoDB(options);
  const results = await truncate(table, client);
  console.log(results);
}


async function truncate(table: string, client: DynamoDB) {
  let numItems: number | undefined;
  let totalItems = 0;
  const batchSize = 25;
  const query: QueryInput = {
    TableName: table,
    AttributesToGet: keys[table as keyof typeof keys],
    Limit: batchSize,
  };
  while (numItems === undefined || numItems > 0) {
    const { Items } = await client.scan(query).promise();
    if (!Items || !Items.length) {
      break;
    }
    numItems = Items.length;
    totalItems += numItems;
    const requests = Items.map(i => {
      console.log(i);
      return {
        DeleteRequest: {
          Key: i,
        },
      };
    });

    await client.batchWriteItem({
      RequestItems: {
        [table]: requests,
      },
    }).promise();


  }
  return totalItems;
}

async function listGraphs(client: DynamoDB) {
  const query: QueryInput = {
    TableName: GRAPH_TABLE,
    AttributesToGet: ['id'],
  };
  const { Items } = await client.scan(query).promise();
  if (Items) {
    return Items.map(d => d.id);
  }
  return null;

}

interface AwsOptions {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

function getAwsOptions(provided: Partial<AwsOptions> = {}) {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
  const options = {
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
