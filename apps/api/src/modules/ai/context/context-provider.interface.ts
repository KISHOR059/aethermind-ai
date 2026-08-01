export interface ContextProvider<TContext> {
  build(userId: string): Promise<TContext>;
}
