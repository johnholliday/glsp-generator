import { Argv } from 'yargs';

export interface ICommand<T = any> {
  readonly command: string | string[];
  readonly describe: string;
  readonly aliases?: string[];
  
  builder(yargs: Argv): Argv<T>;
  handler(args: T): Promise<void>;
}