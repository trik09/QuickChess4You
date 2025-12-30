import styles from './Pricing.module.css';
import { FaCheck } from 'react-icons/fa';

function Pricing() {
  const upcomingFeatures = [
    'Unlimited puzzle access',
    'Advanced analytics & insights',
    'Exclusive tournament entry',
    'Grandmaster video lessons',
    'Personalized training plans',
    'Opening repertoire builder'
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Premium Plans Coming Soon</h1>
        <p className={styles.subtitle}>
          We are working hard to bring you the best chess experience.
        </p>
      </div>

      <div className={styles.comingSoonCard}>
        <div className={styles.contentWrapper}>
          <div className={styles.leftSide}>
            <h2>Unlock Your Full Potential</h2>
            <p className={styles.description}>
              Get ready for a premium experience designed to take your chess game to the next level.
              Stay tuned for our launch!
            </p>
            <div className={styles.notifyBox}>
              <span>🚀 Launching Soon</span>
            </div>
          </div>

          <div className={styles.rightSide}>
            <h3>What to expect:</h3>
            <ul className={styles.featureList}>
              {upcomingFeatures.map((feature, index) => (
                <li key={index}>
                  <div className={styles.iconWrapper}><FaCheck /></div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
