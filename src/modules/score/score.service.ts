import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { Score } from './schemas/score.schema';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class ScoreService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Score.name) private scoreModel: Model<Score>,
  ) {}

  async create(
    createScoreDto: CreateScoreDto,
    user: any,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const { name, email, role, test_name, test_type, score, duration } =
      createScoreDto;

    // Kiểm tra xem email trong request có khớp với email của user đang đăng nhập không
    if (email !== user.email) {
      throw new UnauthorizedException(
        'Unauthorized to submit score for another user',
      );
    }

    try {
      // Lưu điểm vào database
      await this.scoreModel.create({
        name,
        email,
        role,
        test_name,
        test_type,
        score,
        duration,
        submit_date: new Date(),
      });
      return {
        success: true,
        message: 'Score created successfully',
      };
    } catch (error) {
      console.error('Error creating score:', error);

      // Xử lý lỗi duplicate entry
      if (error.code === 11000) {
        throw new BadRequestException('Duplicate score entry');
      }

      throw new InternalServerErrorException('Failed to create score');
    }
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'submit_date',
        order = 'desc',
        search = '',
      } = paginationQuery;

      // Tính toán skip để phân trang
      const skip = (page - 1) * limit;

      // Tạo object sort
      const sortOptions = {};
      sortOptions[sort] = order === 'desc' ? -1 : 1;

      // Tạo điều kiện tìm kiếm
      const searchQuery = search
        ? {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { test_name: { $regex: search, $options: 'i' } },
              { test_type: { $regex: search, $options: 'i' } },
              // Tìm kiếm theo điểm số nếu search là số
              ...(isNaN(Number(search)) ? [] : [{ score: Number(search) }]),
              // Tìm kiếm theo ngày nếu search có thể parse thành ngày
              ...(() => {
                // Chuyển đổi định dạng ngày từ DD/MM/YYYY sang YYYY-MM-DD
                const dateStr = search.replace(/\//g, '-');
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  const [day, month, year] = parts;
                  const formattedDate = `${year}-${month}-${day}`;
                  if (!isNaN(Date.parse(formattedDate))) {
                    const searchDate = new Date(formattedDate);
                    return [
                      {
                        submit_date: {
                          $gte: searchDate,
                          $lt: new Date(
                            searchDate.getTime() + 24 * 60 * 60 * 1000,
                          ),
                        },
                      },
                    ];
                  }
                }
                return [];
              })(),
            ],
          }
        : {};

      // Thực hiện query với phân trang và tìm kiếm
      const [scores, total] = await Promise.all([
        this.scoreModel
          .find(searchQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        this.scoreModel.countDocuments(searchQuery), // Đếm tổng số records với điều kiện tìm kiếm
      ]);

      // Tính toán thông tin phân trang
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: scores,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      };
    } catch (error) {
      console.error('Error finding scores:', error);
      throw new InternalServerErrorException('Failed to get scores');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} score`;
  }

  update(id: number, updateScoreDto: UpdateScoreDto) {
    return `This action updates a #${id} score`;
  }

  remove(id: number) {
    return `This action removes a #${id} score`;
  }
}
