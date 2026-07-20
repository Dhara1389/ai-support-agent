export interface ConnectDbDto {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface NlQueryDto {
  connectionId: string;
  question: string;
}