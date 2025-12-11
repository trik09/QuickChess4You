import styles from './Pricing.module.css';
import { FaCheck } from 'react-icons/fa';

function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      features: [
        '100 puzzles per month',
        'Basic tournaments',
        'Community access',
        'Progress tracking'
      ],
      limitations: [
        'Limited puzzle access',
        'No coaching',
        'Basic analytics'
      ]
    },
    {
      name: 'Premium',
      price: 1499,
      period: 'month',
      popular: true,
      features: [
        'Unlimited puzzles',
        'All tournaments',
        'Priority support',
        'Advanced analytics',
        '1 coaching session/month',
        'Opening database',
        'Game analysis tools'
      ]
    },
    {
      name: 'Pro',
      price: 3999,
      period: 'month',
      features: [
        'Everything in Premium',
        '4 coaching sessions/month',
        'Personal training plan',
        'Tournament preparation',
        'Opening repertoire builder',
        'Unlimited game analysis',
        'Priority tournament entry',
        'Exclusive masterclasses'
      ]
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Choose Your Plan</h1>
        <p className={styles.subtitle}>
          Select the perfect plan to match your chess ambitions
        </p>
      </div>

      <div className={styles.pricingGrid}>
        {plans.map((plan, index) => (
          <div key={index} className={`${styles.priceCard} ${plan.popular ? styles.popular : ''}`}>
            {plan.popular && <div className={styles.badge}>Most Popular</div>}
            
            <h3 className={styles.planName}>{plan.name}</h3>
            <div className={styles.price}>
              {plan.price === 0 ? 'Free' : `₹${plan.price}`}
              {plan.price !== 0 && <span>/{plan.period}</span>}
            </div>

            <ul className={styles.features}>
              {plan.features.map((feature, i) => (
                <li key={i}>
                  <FaCheck className={styles.checkIcon} />
                  {feature}
                </li>
              ))}
              {plan.limitations && plan.limitations.map((limitation, i) => (
                <li key={`limit-${i}`} className={styles.limitation}>
                  <span className={styles.crossIcon}>✗</span>
                  {limitation}
                </li>
              ))}
            </ul>

            <button className={styles.selectBtn}>
              {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
            </button>
          </div>
        ))}
      </div>

      <section className={styles.faq}>
        <h2>Frequently Asked Questions</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3>Can I change my plan later?</h3>
            <p>Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Is there a free trial?</h3>
            <p>Premium and Pro plans come with a 7-day free trial. No credit card required to start.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>What payment methods do you accept?</h3>
            <p>We accept UPI, credit/debit cards, net banking, and all major payment methods through Razorpay.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Can I cancel anytime?</h3>
            <p>Absolutely! Cancel your subscription anytime with no penalties or hidden fees.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Pricing;
