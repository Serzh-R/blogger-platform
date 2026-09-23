import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { UpdateBlogDomainDto } from '../../domain/dto/update-blog.domain-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateBlogCommand {
   constructor(
      public readonly blogId: string,
      public readonly dto: UpdateBlogDomainDto,
   ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<
   UpdateBlogCommand,
   void
> {
   constructor(
      private readonly blogsRepository: BlogsRepository,
      private readonly postsRepository: PostsRepository,
   ) {}

   async execute({ blogId, dto }: UpdateBlogCommand): Promise<void> {
      const blog = await this.blogsRepository.findById(blogId);

      if (!blog) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Blog not found',
         });
      }

      blog.update(dto);

      await this.blogsRepository.save(blog);

      await this.postsRepository.updateBlogName(blog._id.toString(), blog.name);
   }
}
