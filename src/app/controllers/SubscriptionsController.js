import { Op } from 'sequelize';
import { startOfHour, parseISO, isBefore } from 'date-fns';
import Subscription from '../models/subscription';
import Meetup from '../models/meetup';
import User from '../models/user';
import Files from '../models/files';

import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
          include: [
            {
              model: User,
              attributes: ['name', 'email'],
            },
            {
              model: Files,
              as: 'imagem',
              attributes: ['name', 'url'],
            },
          ],
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const user = await User.findByPk(req.userId);
    const meetups = await Meetup.findByPk(req.params.meetupId, {
      include: [User],
    });

    if (meetups.user_id === req.userId) {
      return res.status(400).json({ error: "can't subscribe to own meetups" });
    }

    if (isBefore(new Date(meetups.date), new Date())) {
      return res.status(400).json({ error: "can't subscribe to past meetups" });
    }

    const checkDate = await Subscription.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetups.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: "can't subscribe to two meetups in same date" });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetups.id,
    });

    await Queue.add(SubscriptionMail.key, {
      meetups,
      user,
    });

    return res.json(subscription);
  }

  async delete(req, res) {
    const meetupId = req.params.id;

    const subscription = await Subscription.findOne({
      where: { user_id: req.userId, meetup_id: meetupId },
    });

    if (subscription.user_id !== req.userId) {
      return res.status(401).json({
        error: "you don't have permission to cancel this subscrition",
      });
    }

    subscription.destroy({
      where: { meetup_id: meetupId },
    });

    await subscription.save();

    return res.json(subscription);
  }
}

export default new SubscriptionController();
