import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from '../../domain/blog.entity';
import type { BlogModelType } from '../../domain/blog.entity';
import { CreateBlogDomainDto } from '../../domain/dto/create-blog.domain-dto';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

export class CreateBlogCommand {
   constructor(public readonly dto: CreateBlogDomainDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<
   CreateBlogCommand,
   string
> {
   constructor(
      @InjectModel(Blog.name)
      private readonly BlogModel: BlogModelType,
      private readonly blogsRepository: BlogsRepository,
   ) {}

   async execute({ dto }: CreateBlogCommand): Promise<string> {
      const blog = this.BlogModel.createInstance(dto);

      await this.blogsRepository.save(blog);

      return blog._id.toString();
   }
}
