import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Module } from "@nestjs/common";
import { EvaluationsService } from "./evaluations.service";


@Injectable()
export class Evaluation {
  constructor(
    @InjectModel(Evaluation)
    private evaluation: typeof Evaluation
  ) {}

}
