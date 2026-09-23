import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { UpdatePostDto } from '../dto/update-post.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdatePostCommand {
   constructor(
      public readonly postId: string,
      public readonly dto: UpdatePostDto,
   ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<
   UpdatePostCommand,
   void
> {
   constructor(
      private readonly postsRepository: PostsRepository,
      private readonly blogsRepository: BlogsRepository,
   ) {}

   async execute({ postId, dto }: UpdatePostCommand): Promise<void> {
      const post = await this.postsRepository.findById(postId);

      if (!post) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Post not found',
         });
      }

      const blog = await this.blogsRepository.findById(dto.blogId);

      if (!blog) {
         throw new DomainException({
            code: DomainExceptionCode.BadRequest,
            message: 'Blog not found',
            extensions: [
               {
                  field: 'blogId',
                  message: 'Blog not found',
               },
            ],
         });
      }

      post.update({
         title: dto.title,
         shortDescription: dto.shortDescription,
         content: dto.content,
         blogId: blog._id.toString(),
         blogName: blog.name,
      });

      await this.postsRepository.save(post);
   }
}
