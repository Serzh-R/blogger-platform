import {UserDocument} from '../../domain/user.entity'

export class UserViewDto {
    id: string;
    login: string;
    email: string;
    createdAt: string;

    static mapToView(user: UserDocument): UserViewDto {
        const dto = new UserViewDto();

        dto.id = user._id.toString();
        dto.login = user.login;
        dto.email = user.email;
        dto.createdAt = user.createdAt.toISOString();

        return dto
    }
}