import {
  BadRequestException,
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Test } from './schemas/test.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@Injectable()
export class TestService {
  private readonly logger = new Logger(TestService.name);

  constructor(@InjectModel(Test.name) private testModel: Model<Test>) {}

  async create(createTestDto: CreateTestDto): Promise<{
    success: boolean;
    message: string;
    data: Test;
  }> {
    const checkTestSlugExists = await this.testModel.exists({
      test_slug: createTestDto.test_slug,
    });
    if (checkTestSlugExists) {
      throw new BadRequestException('Test slug already exists');
    }
    const createdTest = await this.testModel.create(createTestDto);
    return {
      success: true,
      message: 'Test created successfully',
      data: createdTest as Test,
    };
  }

  async findAll(): Promise<{
    success: boolean;
    message: string;
    data: Test[];
  }> {
    const tests = await this.testModel.find();
    return {
      success: true,
      message: 'Get all tests successfully',
      data: tests as Test[],
    };
  }

  async findAllReadingTest(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ success: boolean; data: Test[]; pagination: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc',
        search = '',
      } = paginationQuery;

      const skip = (page - 1) * limit;

      const sortOptions = {};
      sortOptions[sort] = order === 'desc' ? -1 : 1;

      const searchQuery = {
        type: 'reading',
        ...(search
          ? {
              $or: [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
              ],
            }
          : {}),
      };

      const [tests, total] = await Promise.all([
        this.testModel
          .find(searchQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        this.testModel.countDocuments(searchQuery),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: tests as Test[],
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
      console.error('Error finding reading tests:', error);
      throw new InternalServerErrorException('Failed to get reading tests');
    }
  }

  async findAllListeningTest(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ success: boolean; data: Test[]; pagination: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc',
        search = '',
      } = paginationQuery;

      const skip = (page - 1) * limit;

      const sortOptions = {};
      sortOptions[sort] = order === 'desc' ? -1 : 1;

      const searchQuery = {
        type: 'listening',
        ...(search
          ? {
              $or: [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
              ],
            }
          : {}),
      };

      const [tests, total] = await Promise.all([
        this.testModel
          .find(searchQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        this.testModel.countDocuments(searchQuery),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: tests as Test[],
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
      console.error('Error finding listening tests:', error);
      throw new InternalServerErrorException('Failed to get listening tests');
    }
  }

  async findOne(id: string): Promise<{
    success: boolean;
    message: string;
    data: Test;
  }> {
    const test = await this.testModel.findById(id).exec();
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return {
      success: true,
      message: 'Test found successfully',
      data: test as Test,
    };
  }

  async getTestBySlug(slug: string): Promise<Test> {
    const test = await this.testModel.findOne({ test_slug: slug }).exec();
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return test as Test;
  }

  async update(
    id: string,
    updateTestDto: UpdateTestDto,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const test = await this.testModel.findById(id).exec();
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const testToValidate = new this.testModel({
      ...test.toObject(),
      ...updateTestDto,
    });

    const validationError = testToValidate.validateSync();
    if (validationError) {
      console.log('Validation error:', validationError);
      throw new BadRequestException(validationError.message);
    }

    try {
      await this.testModel.findByIdAndUpdate(id, updateTestDto, { new: true });
      return {
        success: true,
        message: `Test with id ${id} updated successfully`,
      };
    } catch (error) {
      if (error.code === 11000) {
        this.logger.error(
          `Duplicate key error when updating test ${id}:`,
          error,
        );
        throw new BadRequestException('Duplicate data detected');
      }
      this.logger.error(`Error updating test with id ${id}:`, error.stack);
      throw new BadRequestException(
        'Failed to update test. Please try again later',
      );
    }
  }

  async remove(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const test = await this.testModel.findById(id).exec();
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    try {
      await this.testModel.deleteOne({ _id: id });
      return {
        success: true,
        message: `Test with id ${id} has been deleted successfully`,
      };
    } catch (error) {
      if (error.code === 11000) {
        this.logger.error(
          `Cannot delete test ${id} due to reference constraint:`,
          error,
        );
        throw new BadRequestException(
          'Cannot delete test due to existing references',
        );
      }
      this.logger.error(`Error deleting test with id ${id}:`, error.stack);
      throw new BadRequestException(
        'Failed to delete test. Please try again later',
      );
    }
  }
}
