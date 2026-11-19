import React, { useContext, useState, useEffect } from 'react';
import { Schema, Plugin, BasePdf } from '@pdfme/common';
import { theme, Button } from 'antd';
import { DESIGNER_CLASSNAME } from '../../constants.js';
import { OptionsContext, PluginsRegistry } from '../../contexts.js';
import { toSections, type FieldPalette, type PaletteEntry } from '../../designerOptions.js';
import PluginIcon from './PluginIcon.js';

type DraggableComponent = React.ComponentType<{
  plugin: Plugin<Schema>;
  scale: number;
  basePdf: BasePdf;
  children: React.ReactNode;
}>;

/**
 * The left sidebar of a designer that opts into `fieldPalette`: the fields in titled groups under a hint, with
 * labels that wrap. LeftSidebar renders it in place of its flat list and hands over its own Draggable.
 */
const GroupedFieldPalette = ({
  palette,
  width,
  height,
  scale,
  basePdf,
  Draggable,
}: {
  palette: FieldPalette;
  width: number;
  height: number;
  scale: number;
  basePdf: BasePdf;
  Draggable: DraggableComponent;
}) => {
  const { token } = theme.useToken();
  const pluginsRegistry = useContext(PluginsRegistry);
  const options = useContext(OptionsContext);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const entries = pluginsRegistry
    .entries()
    .flatMap(([label, plugin]): PaletteEntry[] =>
      plugin?.propPanel.defaultSchema ? [{ label, plugin }] : [],
    );
  const smallText = { textAlign: 'left', color: token.colorTextSecondary } as const;

  return (
    <div
      className={DESIGNER_CLASSNAME + 'left-sidebar'}
      style={{
        left: 0,
        right: 0,
        position: 'absolute',
        zIndex: 1,
        height,
        width,
        background: token.colorBgLayout,
        textAlign: 'center',
        overflow: isDragging ? 'visible' : 'auto',
      }}
    >
      {palette.hint && (
        <div
          className={DESIGNER_CLASSNAME + 'palette-hint'}
          style={{ ...smallText, padding: '0.5rem 0.5rem 0', fontSize: 12, lineHeight: 1.35 }}
        >
          {palette.hint}
        </div>
      )}
      {toSections(palette.groups, entries).map((section, index) => (
        <React.Fragment key={section.title ?? `section-${index}`}>
          {section.title && (
            <div
              className={DESIGNER_CLASSNAME + 'palette-group-title'}
              style={{
                ...smallText,
                padding: '0.75rem 0.5rem 0',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {section.title}
            </div>
          )}
          {section.entries.map(({ label, plugin }) => {
            const pluginType = plugin.propPanel.defaultSchema.type;
            const hasIcon = Boolean(options.icons?.[pluginType] ?? plugin.icon);

            return (
              <Draggable key={pluginType} scale={scale} basePdf={basePdf} plugin={plugin}>
                <Button
                  className={DESIGNER_CLASSNAME + 'plugin-' + pluginType}
                  onMouseDown={() => setIsDragging(true)}
                  style={{
                    width: 'calc(100% - 0.5rem)',
                    height: 'auto',
                    minHeight: 35,
                    marginTop: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    justifyContent: 'flex-start',
                    gap: '0.5rem',
                    cursor: 'grab',
                    textAlign: 'left',
                  }}
                >
                  {hasIcon && <PluginIcon plugin={plugin} label={label} />}
                  <span
                    title={label}
                    style={{
                      fontSize: 12,
                      lineHeight: 1.3,
                      minWidth: 0,
                      overflow: 'hidden',
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                    }}
                  >
                    {label}
                  </span>
                </Button>
              </Draggable>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export default GroupedFieldPalette;
