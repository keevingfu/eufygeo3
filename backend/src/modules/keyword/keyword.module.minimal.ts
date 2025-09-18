import { Module } from '@nestjs/common';
import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class KeywordResolver {
  @Query(() => String)
  async hello(): Promise<string> {
    return 'Hello from Eufy GEO Keyword API!';
  }

  @Query(() => String)
  async status(): Promise<string> {
    return 'Eufy GEO API is running successfully!';
  }

  @Query(() => [String])
  async sampleKeywords(): Promise<string[]> {
    return [
      'eufy security camera',
      'eufy robot vacuum',
      'eufy doorbell',
      'smart home automation'
    ];
  }
}

@Module({
  providers: [KeywordResolver],
})
export class KeywordModule {}