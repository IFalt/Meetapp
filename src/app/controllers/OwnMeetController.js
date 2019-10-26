import Meetup from '../models/meetup';
import Files from '../models/files';

class OwnMeetController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      include: [{ model: Files, as: 'imagem' }],
    });

    return res.json(meetups);
  }
}

export default new OwnMeetController();
