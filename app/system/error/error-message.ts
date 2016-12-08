class ErrorMessage {
    constructor(
        public code: string | number,
        public message: string,
        public detail: Nullable<string> = null
    ) {}
}

export = ErrorMessage;
