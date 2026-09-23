import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from '../../domain/comment.entity';
import type { CommentModelType } from '../../domain/comment.entity';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { UsersRepository } from '../../../../user-accounts/infrastructure/users.repository';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class CreateCommentCommand {
   constructor(public readonly dto: CreateCommentDto) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<
   CreateCommentCommand,
   string
> {
   constructor(
      @InjectModel(Comment.name)
      private readonly CommentModel: CommentModelType,
      private readonly commentsRepository: CommentsRepository,
      private readonly postsRepository: PostsRepository,
      private readonly usersRepository: UsersRepository,
   ) {}

   async execute({ dto }: CreateCommentCommand): Promise<string> {
      const post = await this.postsRepository.findById(dto.postId);

      if (!post) {
         throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Post not found',
         });
      }

      const user = await this.usersRepository.findById(dto.userId);

      if (!user) {
         throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'User not found',
         });
      }

      const comment = this.CommentModel.createInstance({
         content: dto.content,
         postId: post._id.toString(),
         userId: user._id.toString(),
         userLogin: user.login,
      });

      await this.commentsRepository.save(comment);

      return comment._id.toString();
   }
}
