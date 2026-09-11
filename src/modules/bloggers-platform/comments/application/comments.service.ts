import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Result, ResultStatus } from '../../../../core/result/result.types';
import { UsersRepository } from '../../../user-accounts/infrastructure/users.repository';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { Comment } from '../domain/comment.entity';
import type { CommentModelType } from '../domain/comment.entity';
import { CommentsRepository } from '../infrastructure/comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { LikesRepository } from '../../likes/infrastructure/likes.repository';

@Injectable()
export class CommentsService {
   constructor(
      @InjectModel(Comment.name)
      private readonly CommentModel: CommentModelType,
      private readonly commentsRepository: CommentsRepository,
      private readonly postsRepository: PostsRepository,
      private readonly usersRepository: UsersRepository,
      private readonly likesRepository: LikesRepository,
   ) {}

   async createComment(dto: CreateCommentDto): Promise<Result<string>> {
      const post = await this.postsRepository.findById(dto.postId);

      if (!post) {
         return {
            status: ResultStatus.NotFound,
            errorMessage: 'Post not found',
            extensions: [],
            data: null,
         };
      }

      const user = await this.usersRepository.findById(dto.userId);

      if (!user) {
         return {
            status: ResultStatus.Unauthorized,
            errorMessage: 'User not found',
            extensions: [],
            data: null,
         };
      }

      const comment = this.CommentModel.createInstance({
         content: dto.content,
         postId: post._id.toString(),
         userId: user._id.toString(),
         userLogin: user.login,
      });

      await this.commentsRepository.save(comment);

      return {
         status: ResultStatus.Created,
         extensions: [],
         data: comment._id.toString(),
      };
   }

   async updateComment(id: string, dto: UpdateCommentDto): Promise<Result> {
      const comment = await this.commentsRepository.findById(id);

      if (!comment) {
         return {
            status: ResultStatus.NotFound,
            errorMessage: 'Comment not found',
            extensions: [],
            data: null,
         };
      }

      if (comment.commentatorInfo.userId !== dto.userId) {
         return {
            status: ResultStatus.Forbidden,
            errorMessage: 'Forbidden',
            extensions: [],
            data: null,
         };
      }

      comment.update({
         content: dto.content,
      });

      await this.commentsRepository.save(comment);

      return {
         status: ResultStatus.NoContent,
         extensions: [],
         data: null,
      };
   }

   // Изменено: добавлено удаление комментария
   async deleteComment(id: string, userId: string): Promise<Result> {
      const comment = await this.commentsRepository.findById(id);

      if (!comment) {
         return {
            status: ResultStatus.NotFound,
            errorMessage: 'Comment not found',
            extensions: [],
            data: null,
         };
      }

      if (comment.commentatorInfo.userId !== userId) {
         return {
            status: ResultStatus.Forbidden,
            errorMessage: 'Forbidden',
            extensions: [],
            data: null,
         };
      }

      await this.commentsRepository.delete(comment);

      await this.likesRepository.deleteByParentIds([comment._id.toString()]);

      return {
         status: ResultStatus.NoContent,
         extensions: [],
         data: null,
      };
   }
}
