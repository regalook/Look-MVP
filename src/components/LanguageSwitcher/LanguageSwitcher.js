import classNames from 'classnames';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  getLocaleFromPath,
  replaceLocaleInPath,
} from '../../context/localeContext';

import css from './LanguageSwitcher.module.css';

/**
 * LanguageSwitcher component for switching between supported languages
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className - Additional CSS class
 * @param {string?} props.rootClassName - Root CSS class override
 * @param {('dropdown'|'buttons'|'links')} props.variant - Display variant
 * @returns {JSX.Element}
 */
const LanguageSwitcher = props => {
  const { className, rootClassName, variant = 'buttons' } = props;

  const location = useLocation();
  const history = useHistory();
  const currentLocale = getLocaleFromPath(location.pathname);

  const handleLocaleChange = newLocale => {
    if (newLocale === currentLocale) return;

    const newPath = replaceLocaleInPath(location.pathname, currentLocale, newLocale);
    const newUrl = `${newPath}${location.search}${location.hash}`;

    // Navigate to the new locale path
    history.push(newUrl);
  };

  const classes = classNames(rootClassName || css.root, className);

  if (variant === 'dropdown') {
    return (
      <div className={classes}>
        <select
          className={css.select}
          value={currentLocale}
          onChange={e => handleLocaleChange(e.target.value)}
          aria-label="Select language"
        >
          {SUPPORTED_LOCALES.map(locale => (
            <option key={locale} value={locale}>
              {LOCALE_LABELS[locale]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variant === 'links') {
    return (
      <div className={classes}>
        {SUPPORTED_LOCALES.map((locale, index) => (
          <React.Fragment key={locale}>
            {index > 0 && <span className={css.separator}>|</span>}
            <button
              type="button"
              className={classNames(css.link, {
                [css.activeLink]: locale === currentLocale,
              })}
              onClick={() => handleLocaleChange(locale)}
              aria-current={locale === currentLocale ? 'true' : undefined}
            >
              {locale.toUpperCase()}
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Default: buttons variant
  return (
    <div className={classes}>
      {SUPPORTED_LOCALES.map(locale => (
        <button
          key={locale}
          type="button"
          className={classNames(css.button, {
            [css.activeButton]: locale === currentLocale,
          })}
          onClick={() => handleLocaleChange(locale)}
          aria-current={locale === currentLocale ? 'true' : undefined}
          aria-label={`Switch to ${LOCALE_LABELS[locale]}`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
