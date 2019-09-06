import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetups, user } = data;

    console.log('a fila executou!');

    await Mail.sendMail({
      to: `${meetups.User.name} <${meetups.User.email}>`,
      subject: `[${meetups.title}] Nova inscrição`,
      template: 'subscriptions',
      context: {
        organizer: meetups.User.name,
        meetup: meetups.title,
        user: user.name,
        email: user.email,
      },
    });
  }
}

export default new SubscriptionMail();
