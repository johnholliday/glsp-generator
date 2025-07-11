import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const modelSchema = Joi.object({
  id: Joi.string().optional(),
  nodes: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required(),
    position: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required()
    }).required(),
    size: Joi.object({
      width: Joi.number().positive().required(),
      height: Joi.number().positive().required()
    }).required(),
    modelElement: Joi.object().optional()
  })).default([]),
  edges: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required(),
    sourceId: Joi.string().required(),
    targetId: Joi.string().required(),
    routingPoints: Joi.array().items(Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required()
    })).optional()
  })).default([])
});

export function validateModelRequest(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = modelSchema.validate(req.body);
  
  if (error) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
    return;
  }

  req.body = value;
  next();
}