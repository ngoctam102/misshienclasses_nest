import { Injectable } from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Test } from './schemas/test.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class TestService {
  constructor(@InjectModel(Test.name) private testModel: Model<Test>) {}

  async create(createTestDto: CreateTestDto): Promise<Test> {
    const createdTest = await this.testModel.create(createTestDto);
    return createdTest as Test;
  }

  async findAll(): Promise<Test[]> {
    const tests = await this.testModel.find();
    return tests as Test[];
  }

  findOne(id: number) {
    return `This action returns a #${id} test`;
  }

  async getTestBySlug(slug: string): Promise<Test> {
    const test = await this.testModel.findOne({ test_slug: slug }).exec();
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return test as Test;
  }

  update(id: number, updateTestDto: UpdateTestDto) {
    return `This action updates a #${id} test`;
  }

  remove(id: number) {
    return `This action removes a #${id} test`;
  }
}
