import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Test } from './schemas/test.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

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

  async findAllReadingTest(): Promise<Test[]> {
    const readingTests = await this.testModel.find({ type: 'reading' });
    return readingTests as Test[];
  }

  async findAllListeningTest(): Promise<Test[]> {
    const listeningTests = await this.testModel.find({ type: 'listening' });
    return listeningTests as Test[];
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
