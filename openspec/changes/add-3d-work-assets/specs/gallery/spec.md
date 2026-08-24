## ADDED Requirements

### Requirement: 3D作品徽标

系统 SHALL 在作品卡片上对含 3D 资源的作品展示「3D」徽标。

#### Scenario: 卡片展示3D徽标

- **WHEN** 作品包含至少一个 3D 资源
- **THEN** 首页瀑布流作品卡片展示「3D」徽标

#### Scenario: 无3D资源不展示徽标

- **WHEN** 作品不含任何 3D 资源
- **THEN** 作品卡片不展示「3D」徽标

### Requirement: 3D内容筛选

系统 SHALL 允许用户在作品 tab 内通过「3D」筛选 chip 仅浏览含 3D 资源的作品。

#### Scenario: 筛选3D作品

- **WHEN** 用户在作品 tab 点击「3D」筛选 chip
- **THEN** 瀑布流仅展示含 3D 资源的作品

#### Scenario: 取消3D筛选

- **WHEN** 用户再次点击已选中的「3D」chip
- **THEN** 该筛选被取消,恢复展示全部作品
