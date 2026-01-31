declare module 'qs' {
    export function stringify(
        obj: any,
        options?: any
    ): string

    export function parse(
        str: string,
        options?: any
    ): any

    const qs: {
        stringify: typeof stringify
        parse: typeof parse
    }

    export default qs
}
