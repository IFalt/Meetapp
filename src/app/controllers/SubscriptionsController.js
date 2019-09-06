import { Op } from 'sequelize';
import Subscription from '../models/subscription';
import Meetup from '../models/meetup';
import User from '../models/user';

import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/Queue';

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

    if (meetups.past) {
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
}

export default new SubscriptionController();
