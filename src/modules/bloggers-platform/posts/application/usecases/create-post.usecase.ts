import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../../domain/post.entity';
import type { PostModelType } from '../../domain/post.entity';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { CreatePostDto } from '../dto/create-post.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class CreatePostCommand {
   constructor(public readonly dto: CreatePostDto) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<
   CreatePostCommand,
   string
> {
   constructor(
      @InjectModel(Post.name)
      private readonly PostModel: PostModelType,
      private readonly postsRepository: PostsRepository,
      private readonly blogsRepository: BlogsRepository,
   ) {}

   async execute({ dto }: CreatePostCommand): Promise<string> {
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

      const post = this.PostModel.createInstance({
         title: dto.title,
         shortDescription: dto.shortDescription,
         content: dto.content,
         blogId: blog._id.toString(),
         blogName: blog.name,
      });

      await this.postsRepository.save(post);

      return post._id.toString();
   }
}
