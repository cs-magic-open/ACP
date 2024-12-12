import * as vscode from "vscode";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogMetadata {
  [key: string]: any;
}

type LogArg = string | Error | LogMetadata;

// ANSI color codes for VS Code output
const Colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bright: "\x1b[1m",
  debug: "\x1b[2m", // Dim gray
  info: "\x1b[36m", // Cyan
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  metadata: "\x1b[2;37m", // Dim white
  timestamp: "\x1b[2;36m", // Dim cyan
} as const;

class Logger {
  private static instance: Logger;
  private channel: vscode.OutputChannel;
  private logLevel: LogLevel = LogLevel.INFO;
  private usePrefix: boolean = false;

  private constructor(name: string) {
    this.channel = vscode.window.createOutputChannel(name, {
      log: true,
    });
  }

  public static getInstance(name: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(name);
    }
    return Logger.instance;
  }

  public setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public setUsePrefix(usePrefix: boolean): void {
    this.usePrefix = usePrefix;
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return Colors.debug;
      case LogLevel.INFO:
        return Colors.info;
      case LogLevel.WARN:
        return Colors.warn;
      case LogLevel.ERROR:
        return Colors.error;
      default:
        return Colors.reset;
    }
  }

  private formatMetadata(metadata: LogMetadata): string {
    const formattedEntries = Object.entries(metadata)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(" ");
    return `${Colors.metadata}${formattedEntries}${Colors.reset}`;
  }

  private formatError(error: Error): string {
    return `${Colors.error}${error.name}: ${error.message}${Colors.reset}\n${
      Colors.dim
    }${error.stack || ""}${Colors.reset}`;
  }

  private formatMessage(level: LogLevel, args: LogArg[]): string {
    let message = "";
    let metadata: LogMetadata = {};

    args.forEach((arg) => {
      if (arg instanceof Error) {
        message += " " + (this.usePrefix ? this.formatError(arg) : arg.message);
      } else if (typeof arg === "object") {
        Object.assign(metadata, arg);
      } else {
        message +=
          " " +
          (this.usePrefix
            ? `${this.getLevelColor(level)}${arg}${Colors.reset}`
            : arg);
      }
    });

    const metadataStr =
      Object.keys(metadata).length > 0
        ? " " +
          (this.usePrefix
            ? this.formatMetadata(metadata)
            : JSON.stringify(metadata))
        : "";

    if (!this.usePrefix) {
      return `${message.trim()}${metadataStr}`;
    }

    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level].padEnd(5);
    const levelColor = this.getLevelColor(level);
    const prefix = `${Colors.timestamp}[${timestamp}]${Colors.reset} ${levelColor}${levelStr}${Colors.reset} -`;

    return `${prefix}${message}${metadataStr}`;
  }

  private log(level: LogLevel, ...args: LogArg[]): void {
    if (level >= this.logLevel) {
      this.channel.appendLine(this.formatMessage(level, args));
    }
  }

  // Debug overloads
  public debug(message: string): void;
  public debug(metadata: LogMetadata): void;
  public debug(error: Error): void;
  public debug(message: string, metadata: LogMetadata): void;
  public debug(message: string, error: Error): void;
  public debug(
    messageOrMetadataOrError: string | LogMetadata | Error,
    metadataOrError?: LogMetadata | Error
  ): void {
    this.log(
      LogLevel.DEBUG,
      messageOrMetadataOrError,
      metadataOrError as LogArg
    );
  }

  // Info overloads
  public info(message: string): void;
  public info(metadata: LogMetadata): void;
  public info(error: Error): void;
  public info(message: string, metadata: LogMetadata): void;
  public info(message: string, error: Error): void;
  public info(
    messageOrMetadataOrError: string | LogMetadata | Error,
    metadataOrError?: LogMetadata | Error
  ): void {
    this.log(
      LogLevel.INFO,
      messageOrMetadataOrError,
      metadataOrError as LogArg
    );
  }

  // Warn overloads
  public warn(message: string): void;
  public warn(metadata: LogMetadata): void;
  public warn(error: Error): void;
  public warn(message: string, metadata: LogMetadata): void;
  public warn(message: string, error: Error): void;
  public warn(
    messageOrMetadataOrError: string | LogMetadata | Error,
    metadataOrError?: LogMetadata | Error
  ): void {
    this.log(
      LogLevel.WARN,
      messageOrMetadataOrError,
      metadataOrError as LogArg
    );
  }

  // Error overloads
  public error(message: string): void;
  public error(metadata: LogMetadata): void;
  public error(error: Error): void;
  public error(message: string, metadata: LogMetadata): void;
  public error(message: string, error: Error): void;
  public error(
    messageOrMetadataOrError: string | LogMetadata | Error,
    metadataOrError?: LogMetadata | Error
  ): void {
    this.log(
      LogLevel.ERROR,
      messageOrMetadataOrError,
      metadataOrError as LogArg
    );
  }

  public show(): void {
    this.channel.show();
  }

  public dispose(): void {
    this.channel.dispose();
  }
}

export const logger = Logger.getInstance("Awesome Coding Prompts");
